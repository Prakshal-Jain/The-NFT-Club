const express = require("express");
const router = express.Router();
const userModel = require("../models/user_object");
const path = require('path');
var fs = require('fs');
const { objectModel } = require("../models/item_object");
const multer = require('multer');
const utilities = require('../utilities')


router.get('/all-marketplace-items', async (req, res) => {
    const user = await utilities.authenticateUser(req.cookies.auth_token)
    if (user === null) {
        res.status(401);
        res.json({ message: "Unauthorized user." });
        return
    }

    objectModel.find({ item_type: 'marketplace' }, (err, items) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            const item_list = items.map(item => {
                item["_id"] = undefined;
                item["__v"] = undefined;
                item["owner"] = undefined;
                item["auction_detail"] = undefined;
                return item;
            });
            res.status(200);
            res.json(item_list);
        }
    });
});

// using multer to store images 
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100000000 // 100000000 Bytes = 100 MB
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.toLowerCase().match(/\.(png|jpg)$/)) {
            // upload only png and jpg format
            return cb(new Error('Please upload a Image'))
        }
        cb(undefined, true)
    }
})

// uploading a new item 
router.post('/', upload.single('item_image'), async (req, res, next) => {
    const user = await utilities.authenticateUser(req.cookies.auth_token)
    if (user === null) {
        res.status(401);
        res.json({ message: "Unauthorized user." });
        return
    }

    if (req.body.item_type !== 'marketplace' && req.body.item_type !== 'auction' && req.body.item_type !== 'none') {
        res.status(403);
        res.json({ message: "Invalid Item Type." });
        return
    }

    // If an NFT with the same name already exist, throw error
    const existingItem = await objectModel.find({ item_type: req.body.item_type, item_name: req.body.item_name });
    if (existingItem.length > 0) {
        res.status(403);
        res.json({ message: "An NFT with this name already exist, please use some other name." });
        return
    }

    userModel.find({ auth_token: req.cookies.auth_token }, async (err, token_list) => {
        if (err) {
            console.log(err);
        }
        else {
            if (token_list.length === 0) {
                res.status(403);
                res.json({ message: "User profile Not Found" });
            } else {
                if (req.body.item_name !== null && req.body.item_image !== null && req.body.description !== null && req.body.price !== null) {
                    const user = token_list[0];
                    const item_data = {
                        item_name: req.body.item_name,
                        item_image: req.file.filename,
                        description: req.body.description,
                        price: req.body.price,
                        owner: user,
                        item_type: req.body.item_type
                    }

                    const newItem = new objectModel(item_data)

                    newItem.save(function (err, item) {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            res.status(200);
                            res.json({ message: "Item created successfully." });
                        }
                    });
                }
                else {
                    res.status(403);
                    res.json({ message: "Please fill all requred fields." });
                }
            }
        }
    });
});

router.post('/buy-marketplace-item', async (req, res) => {
    const user = await utilities.authenticateUser(req.cookies.auth_token)
    if (user === null) {
        res.status(401);
        res.json({ message: "Unauthorized user." });
        return
    }

    // Check if the item exist
    const items = await objectModel.find({ item_type: req.body.item_type, item_name: req.body.item_name });
    if (items.length === 0) {
        res.status(403);
        res.json({ message: "Item does not exist." });
        return
    }

    const item = items[0];
    // Check if user is not the same as the owner of the object
    if (item.owner.auth_token === user.auth_token) {
        res.status(403);
        res.json({ message: "You are the owner of the item. Buying your own item is not allowed." });
        return
    }

    if (item.owner.balance < item.price) {
        res.status(403);
        res.json({ message: "You do not have the sufficient funds to purchase this item." });
        return
    }

    // if user shopping cart don't already have the item, add this item to buyer (user) shopping cart.
    const existing = user.shopping_cart.filter(x => (x.item_name === item.item_name && x.item_type === item.item_type));
    if (existing.length > 0) {
        res.status(403);
        res.json({ message: "Item already in your shopping cart." });
        return
    }
    
    user.shopping_cart.push(item);
    user.save()

    // TO BE MPLEMENTED WHEN PERSON BUY ITEMS FROM SHOPPING CART
    // Add price to seller
    // Subtract price from buyer
    // Change owner
    // Add to transaction model (database)
    // Add to sold_items

    // NOTE: if item is in shopping cart, and other user already bought it, delete from all other users.

    res.status(200);
    res.send({ message: "Item bought successfully!" });
});

router.get('/selling-details', (req, res) => {
    res.status(200);
    res.send("GET request for selling details");
});


module.exports = router;