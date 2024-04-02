require('dotenv').config()
const Empresas = require('../models/Empresas')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

async function checkData(req, res) {
  // comprueba si existe el dato que traemos por parámetro
  // debe pasarse un objeto tipo { nombre_campo: req.body.nombre_campo }
  try {
    const check = await Empresas.findOne(req)
    return check
  } catch (error) {
    console.log(error)
  }
}

const EmpresasController = {
  async create(req, res) {
    try {
      // validamos que estén todos los campos requeridos
      const data = req.body
      if (!data.Nombre || !data.Sector || !data.Dirección || !data.Tamaño
        || !data.Email || !data.Password) {
          return res.status(401).send({ message: 'faltan datos' })
        }
      // validamos que el email no esté ya utilizado
      await checkData({Email: req.body.Email})
      // encriptamos el password
      const password = bcrypt.hashSync(req.body.Password, 10)
      const empresa = await Empresas.create({...req.body, Password: password})
      res.status(201).send({ message: 'empresa creada correctamente', empresa})
    } catch (error) {
      console.log(error)
      if (error?.code === 11000) return res.status(401)
        .send({ message: 'el email ya existe, elige otro'})

      if (error?.errors?.Email?.kind === 'regexp') return res.status(401)
      .send({ message: 'formato de email erróneo'})

      res.status(500).send({ message: 'error en la creación de la empresa'})
    }
  },

  async delete (req, res) {
    try {
      if (!req.body.Email || !req.body.Password) return res.status(400).send({message: 'faltan datos'})
      const checkEmpresa = await checkData({Email: req.body.Email})
      const checkPassword = checkEmpresa ? bcrypt.compareSync(req.body.Password, checkEmpresa.Password) : false

      if (!checkEmpresa || !checkPassword) return res.status(401).send({message: 'email o password incorrectos'})
      await Empresas.findByIdAndDelete(checkEmpresa._id)
      res.status(200).send({message: 'empresa eliminada correctamente'})
    } catch (error) {
      console.log(error)
      res.status(500).send({message: 'error en la eliminación de la empresa'})
    }
  },

  async login(req, res) {
    try {
      const checkEmpresa = await checkData({Email: req.body.Email})
      const checkPassword = checkEmpresa ? bcrypt.compareSync(req.body.Password, checkEmpresa.Password) : false

      if (!checkEmpresa || !checkPassword) return res.status(401).send({message: 'email o password incorrectos'})

      if (checkEmpresa.Token) return res.status(401).send({message: 'el usuario ya estaba logado'})

      const token = jwt.sign({ _id: checkEmpresa._id }, process.env.JWT_SECRET)
      const empresa = await Empresas.findByIdAndUpdate(checkEmpresa._id, {$set: {Token: token}}, {new: true})
      res.status(201).send({message: 'login correcto', empresa})
    } catch (error) {
      console.log(error)
      res.status(500).send({message: 'error en login'})
    }
  },

  async logout(req, res) {
    try {
      if (!req.headers.authorization) return res.status(401).send({message: 'falta el token'})

      const checkToken = await Empresas.findOne({Token: req.headers.authorization})
      if (!checkToken) return res.status(401).send({message: 'token erróneo'})

      await Empresas.findByIdAndUpdate(checkToken._id, {$set: {Token: ''}}, {new: true})
      res.status(201).send({message: 'logout correcto'})
    } catch (error) {
      console.log(error);
      res.status(500).send({message: 'error en logout'})
    }
  },

  async getAll(req, res) {
    try {
      /* 
      si queremos añadir paginación:
      const { page = 1, limit = 10 } = req.query
      const empresasData = await Empresas.find().limit(limit).skip(page - 1) * limit)
      */
      const empresasData = await Empresas.find()
      res.status(200).send(empresasData)
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: 'error en la petición de datos' })
    }
  },
  
  async getAllBySector(req, res) {
    const sector = new RegExp(req.params.Sector, 'i')
    try {
      const empresaSector = await Empresas.find({ Sector : sector })
      res.status(200).send(empresaSector)
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: 'error en la petición de datos' })
    }
  },

  async getByName(req, res){
    const nombre = new RegExp(req.params.Nombre, 'i')

    try {
      const empresa = await Empresas.findOne({
        Nombre: nombre
      })
      if(empresa){
        res.status(200).send(empresa)
      }else{
        res.status(404).send({ message: 'Empresa no encontrada' });
      }
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: 'error en la petición de datos' })
    }
  },
  async getBySize(req, res){
    const tamano = req.params.Tamano
    try {
      const tamanoSelected = await Empresas.find({Tamaño: tamano})
        res.status(200).send(tamanoSelected)
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: 'error en la petición de datos' })
    }
  
},

  //FALTA DEPURAR ESTO (NO TIRA)
  async searchByName(req, res) {
    const nombre = req.params.Nombre; 
    try{
      const empresas = await Empresas.find({ Nombre: new RegExp(nombre, 'i') });
      if (empresas.length > 0) {
        res.status(200).send(empresas);
      } else {
        res.status(404).send({ message: 'Empresas no encontradas' });
      }
    }catch (error) {
      console.log(error);
      res.status(500).send({ message: 'Error en la petición de datos' });
    }
  },

  async update (req, res) {
    try {
      if (!req.body) return res.status(401).send({message: 'añade algún dato a modificar'})
      if (req.body.Token) return res.status(401).send({message: 'no puedes modificar el token'})
      if (!req.headers.authorization) return res.status(401).send({message: 'falta el token'})

      const empresa = await Empresas.findById(req.params._id)
      if (empresa.Token !== req.headers.authorization) return res.status(401).send({message: 'usuario no autorizado'})

      let password = empresa.Password
      if (req.body.Password) { password = bcrypt.hashSync(req.body.Password, 10) }

      await Empresas.updateOne({_id: req.params._id},
        { ...req.body, Password: password }, { new: true })
      res.status(201).send({message: 'datos actualizados correctamente',  ...empresa._doc, ...req.body, Password: password })
    } catch (error) {
      console.log(error)
      res.status(500).send({message: 'Error intentando actualizar los datos'})
    }
  }
}

module.exports = EmpresasController