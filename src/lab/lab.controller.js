const Lab = require('./lab.model');
const fs = require("fs");
const { uuid } = require('uuidv4');
const path = require('path');


class LabController {

    createFolder(req, res, next) {
        //create doc in database
        req.body.labId  = uuid();
        const lab = new Lab(req.body);
        lab
            .save()
            .then(() => res.redirect('back'))
            .catch(next)
        //create new folder   
        const root = path.join(__dirname, req.body.labName)
        fs.mkdir(root,(err) => {});
        fs.mkdir(`${root}/log_train`,(err) => {})
        fs.mkdir(`${root}/log_test`,(err) => {})
        fs.mkdir(`${root}/trained_model`,(err) => {})
    }

}
module.exports = new LabController();



