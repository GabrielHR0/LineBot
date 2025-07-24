const  Suport  = require('../models/Suport');
const  Client  = require('../models/Client');

class SuportController {

  async initSuport(contact) {
    const existingSuport = await Suport.findOne({ contact: contact.number, status: 'in_progress' });
    
    if (existingSuport) {
      return existingSuport;
    }

    let client = await Client.findOne({ number: contact.number });
    if (!client){
        client = await Client.createClient(contact);
    }

    const suport = Suport.new(contact.number, client._id);

    client.setCurrentSession(suport.sessionId)

    await suport.save();
    await client.save();

    return suport;
  }

  async closeSuport(contactNumber) {
      const suport = await this.getSuportByContact(contactNumber);
      if (!suport) return null;
    
      await Client.findOneAndUpdate(
        {
          number: contactNumber,
          currentSession: suport.sessionId
        },
        { $unset: { currentSession: "" } }
      )
      const resume = suport.closeSuport();
      await suport.save();

      return resume;
  }

  async getSuportByContact(contact){
    return await Suport.findOne({contact, status : "in_progress"}) ?? new Error('Não foi encontrado nenum suport ativo para esse contato');
  }

  async setCurrentProduct(contact, product){
    const suport = await this.getSuportByContact(contact);
    suport.setCurrentProduct(product);
  }

  async setCurrentOrcamento(sessionId, orcamento){
    await Suport.findOneAndUpdate(
      { sessionId },
      { $set: { currentOrcamento: orcamento } }
    );
  }
  
  async findBySession(sessionId){
    return await Suport.findOne({ sessionId });
  }

  async getCurrentSuport(sessionId) {
    const foundSuport = await Suport.findOne({ sessionId, status : "in_progress"});
    if (foundSuport) {
      return foundSuport;
    }
    return null;
  }

  async getCurrentProduct(suport){
    await suport.populate({
      path: 'currentProduct.product',
      model: suport.currentProduct.productType
    })
    return suport.currentProduct.product;
  }

}

module.exports = new SuportController();