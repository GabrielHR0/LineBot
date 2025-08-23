const Group = require('../models/Group')

class GroupController {

    async create(name, description = ""){
        return await Group.create({
            name,
            description
        })
    }

    async pushSubGrup(_id, subGroupId){
        return await Group.updateOne(
            { _id },
            { $addToSet: { subGroups: subGroupId } }
        )
    }
}

module.exports = new GroupController();