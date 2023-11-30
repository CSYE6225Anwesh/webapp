const express = require('express');
const assignmentController = require('../controllers/assignmentController');

const router = express.Router();

// Define assignment routes
router.post('/assignments', assignmentController.createAssignment);
router.put('/assignments/:id', assignmentController.updateAssignment);
router.get('/assignments/:id', assignmentController.getAssignmentDetails);
router.delete('/assignments/:id', assignmentController.deleteAssignment);
router.get('/assignments', assignmentController.getAllAssignments);
router.post('/assignments/:id/submission', assignmentController.submitAssignment);

router.patch('/assignments/:id', (req, res) => {
    // Return 405 Method Not Allowed
    res.status(405).send('Method Not Allowed');
});
  


module.exports = () => router;  // Export as a function