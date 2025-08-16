class FrameInfo {
    constructor(frame) {
        this.frame = { ...frame };
        this.prepare = frame.prepare;
        this.list = frame.list;
        this.text = frame.text;
        this.exit = frame.exit || false;
        this.jump = frame.jump ?? null;

    }

    parserText(data) {
        console.log("FrameInfo.parserText");
        console.log("Texto original:", this.frame.text);
        console.log("Dados recebidos para substituir:", data);

        let text = this.frame.text;
        for (let att in data) {
            console.log(`Substituindo: ${att} -> ${data[att]}`);
            text = text.replace(att, data[att]);
        }

        text = text.replace(/@/g, ""); // Remove arrobas no texto final
        console.log("Texto final após substituições:", text);

        return text;
    }

    extractAttData(dataToSubmit) {
        console.log("FrameInfo.extractAttData");
        console.log("Dados recebidos para extração:", dataToSubmit);
        let result = {};

        if (!Array.isArray(this.prepare?.listAtt)) {
            console.warn("prepare.listAtt não é um array!");
            return result;
        }

        for (let i = 0; i < this.prepare.listAtt.length; i++) {
            let att = this.prepare.listAtt[i];
            result[att] = dataToSubmit[att];
            console.log(`Extraído: ${att} = ${result[att]}`);
        }

        console.log("Resultado final da extração:", result);
        return result;
    }

    getResume(data) {
        console.log("FrameInfo.getResume");
        let text = this.parserText(data);
        return text;
    }
}

module.exports = FrameInfo;
