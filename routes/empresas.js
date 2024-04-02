const express = require('express')
const router = express.Router()
const EmpresasController = require('../controllers/EmpresasController')

router.get('/', EmpresasController.getAll)
router.post('/create', EmpresasController.create)
router.put('/login',EmpresasController.login)
router.put('/logout', EmpresasController.logout)
router.get('/getAllBySector/:Sector', EmpresasController.getAllBySector)
router.get('/getByName/:Nombre', EmpresasController.getByName);
router.get('/getBySize/:Tamano', EmpresasController.getBySize);
//SEARCH
router.get('/search/:Nombre', EmpresasController.searchByName);
router.put('/update/:_id', EmpresasController.update)
router.delete('/delete', EmpresasController.delete)

//
module.exports = router