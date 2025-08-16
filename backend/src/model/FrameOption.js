
class FrameOption {
    constructor(option) {
        this.text = option.text
        this.id = option.id
        this.onSelect = option.onSelect
        this.prepare = option.prepare
        this.list = option.list
        this.type = option.type
        this.jump = option.jump
    }

    getOption(choice) {
        console.log("getOption");

        return this.list.find((s) => { 
            return s.id == choice })
    }


    fillList(dataList = []) {
        if (this.list.length > 0) {
            console.log("Esse frame já possui options. A list não foi alterada");
            return false;
        }
        this.list = [];

        dataList.forEach((d, i) => {
            let op = {
                id: (i + 1).toString(),
                text: d.value + '\n',
                content: {
                    id: {
                        name: this.prepare.content.id,
                        value: d.id,
                    },
                    value: d.value
                },
                route : this.prepare.subRoute,
                onSelect: this.prepare.onSelect
            };

            this.list.push(op);
        });
    }


    getResume() {
        let text = this.text;

        this.list.forEach((op)=>{
            text += `${op.id} - ${op.text}`
        })

        return text;
    }

}

module.exports = FrameOption