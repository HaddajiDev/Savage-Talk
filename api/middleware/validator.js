const {check, validationResult} = require("express-validator");

exports.registerRules = () =>
    [
        check('email', 'email is required').notEmpty(),
        check('email', 'email is required').isEmail(),
        check('username', 'username is required').notEmpty(),
        check('username', 'username is required').isLength({
            max:15,
            min:3,
        }),
        
        check('password', 'password is required').isLength({
            min:6,
            max:20
        }),
];


exports.loginRules = () =>
    [
        check('email', 'email is required').notEmpty(),
        check('email', 'email is required').isEmail(),        
        check('password', 'password is required').isLength({
            min:6,
            max:20
        }),
];



exports.validation = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).send({errors: errors.array()});
    }
    next();
}