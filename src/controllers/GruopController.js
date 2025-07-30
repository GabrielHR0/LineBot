const Group = require('../models/')

class GroupController {

    async create(name, description = ""){
        return await Group.create({
            name,
            description
        })
    }
}