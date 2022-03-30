const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// Load User model
const User = require("../../models/User");

// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
  // Form validation

  const { errors, isValid } = validateRegisterInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      });

      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
  // Form validation

  const { errors, isValid } = validateLoginInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({ email }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }

    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name
        };

        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

// router.post("/uploadFile",uploadToAzure.single('file'),(req,res)=>{
//       try {
//         if(!req.file){
//           return; 
//         }

//         let filePath = (req && req.file && req.file.url) || "";
//         return res.status(400).json({ filePath: "uploaded successfully" });
        
//       } catch (error) {
//         return res
//           .status(400)
//           .json({ passwordincorrect: "file could not be uploaded" });
        
//       }
// })

// const uploadToAzure = multer({
//   fileFilter: function (req,file,cb){
//     if(path.extname(file.originalname) === '.xlsx' || path.extname(file.originalname) === '.xls' || path.extname){
//       return cb(null, true)
//     };
//     return cb('Only excell file is allowed to upload');
//   },
//   storage: new MulterAzureStorage({
//     azureStorageConnectionString:process.env.xyz,
//     containerName: 'receivable',
//     containerSecurity:'blob'
//   })
// })

// var storage = multer.diskStorage({ //multers disk storage settings
//   destination: function (req, file, cb) {
//       cb(null, './uploads/')
//   },
//   filename: function (req, file, cb) {
//       var datetimestamp = Date.now();
//       cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
//   }
// });


var upload = multer({ //multer settings
  storage: storage,
  fileFilter : function(req, file, callback) { //file filter
      if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
          return callback(new Error('Wrong extension type'));
      }
      callback(null, true);
  }
}).single('file');

var upload = multer({ //multer settings
  storage: storage
}).single('file');
/** API path that will upload the files */
router.post('/upload', function(req, res) {
upload(req,res,function(err){
if(err){
res.json({error_code:1,err_desc:err});
return;
}
res.json({error_code:0,err_desc:null});
});
});


module.exports = router;
