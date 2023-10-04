const express = require('express');
const assignmentController = require('../controllers/assignmentController');

const router = express.Router();

// Define assignment routes
router.post('/assignments', assignmentController.createAssignment);
router.put('/assignments/:id', assignmentController.updateAssignment);
router.get('/assignments/:id', assignmentController.getAssignmentDetails);
router.delete('/assignments/:id', assignmentController.deleteAssignment);
router.get('/assignments', assignmentController.getAllAssignments);


module.exports = () => router;  // Export as a function