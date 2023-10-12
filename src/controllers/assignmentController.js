const express = require('express');
const { Assignment } = require('../db/db'); // Adjust the path based on your actual structure
const basicAuth = require('basic-auth');
const { User } = require('../db/db');
const bcrypt = require('bcrypt');

const assignmentController = express.Router();


const authenticateUser = async (email, providedPassword) => {
  try {
    // Find the user based on the provided email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return { error: 'User not found' };
    }

    // Compare the provided password with the hashed password from the database
    const passwordMatches = await bcrypt.compare(providedPassword, user.password);

    if (!passwordMatches) {
      return { error: 'Invalid password' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw new Error('Error authenticating user');
  }
};



// Create Assignment
const createAssignment = async (req, res) => {
  const credentials = basicAuth(req);

  if (!credentials) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const { name, points, num_of_attempts, deadline, assignment_created, assignment_updated } = req.body;

  // Check if required fields are missing
  if (!name || !points || !num_of_attempts || !deadline) {
    res.status(400).json({ error: 'Bad Request: Missing required fields' });
    return;
  }

  // Check if num_of_attempts and points are within the specified range
  if (num_of_attempts < 1 || num_of_attempts > 100 || points < 1 || points > 100) {
    res.status(400).json({ error: 'Bad Request: Invalid num_of_attempts or points' });
    return;
  }

  // Check if assignment_created or assignment_updated are provided by the user
  if (assignment_created || assignment_updated) {
    res.status(403).json({ error: 'Forbidden: Cannot provide assignment_created or assignment_updated' });
    return;
  }

  const email = credentials.name;
  const providedPassword = credentials.pass;

  try {
    const authResult = await authenticateUser(email, providedPassword);

    if (authResult.error) {
      res.status(401).json({ error: authResult.error });
      return;
    }

    const user = authResult.user;

    // Passwords match, proceed to create the assignment
    const assignment = await Assignment.create({
      name,
      points,
      num_of_attempts,
      deadline,
      user_id: user.id // Linking to the user
    });

    res.status(201).json({ success: true, assignment });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Error creating assignment', message: error.message });
  }
};



// Update Assignment
const updateAssignment = async (req, res) => {
  const credentials = basicAuth(req);

  if (!credentials) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const assignmentId = req.params.id;
  const { name, points, num_of_attempts, deadline, assignment_created, assignment_updated } = req.body;

  // Check if required fields are missing
  if (!name || !points || !num_of_attempts || !deadline) {
    res.status(400).json({ error: 'Bad Request: Missing required fields' });
    return;
  }

  // Check if num_of_attempts and points are within the specified range
  if (num_of_attempts < 1 || num_of_attempts > 100 || points < 1 || points > 100) {
    res.status(400).json({ error: 'Bad Request: Invalid num_of_attempts or points' });
    return;
  }

  // Check if assignment_created or assignment_updated are provided by the user
  if (assignment_created || assignment_updated) {
    res.status(403).json({ error: 'Forbidden: Cannot provide assignment_created or assignment_updated' });
    return;
  }

  const email = credentials.name;
  const providedPassword = credentials.pass;

  try {
    const authResult = await authenticateUser(email, providedPassword);

    if (authResult.error) {
      res.status(401).json({ error: authResult.error });
      return;
    }

    const user = authResult.user;

    // Ensure the assignment exists and is owned by the authenticated user
    const assignment = await Assignment.findOne({ where: { id: assignmentId, user_id: user.id } });

    if (!assignment) {
      res.status(403).json({ error: 'Assignment not found or you do not have permission to update it' });
      return;
    }

    // Update the assignment
    await assignment.update({
      name,
      points,
      num_of_attempts,
      deadline
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Error updating assignment', message: error.message });
  }
};



// Get Assignment Details
const getAssignmentDetails = async (req, res) => {
  const credentials = basicAuth(req);

  if (!credentials) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const assignmentId = req.params.id;
  const email = credentials.name;
  const providedPassword = credentials.pass;

  // Check if there are query parameters or request body
  if (Object.keys(req.query).length > 0 || (req.body && Object.keys(req.body).length > 0)) {
    res.status(400).send();  // Bad Request if either query parameters or request body present
    return;
  }

  try {
    const authResult = await authenticateUser(email, providedPassword);

    if (authResult.error) {
      res.status(401).json({ error: authResult.error });
      return;
    }

    // Find the assignment based on the provided assignmentId
    const assignment = await Assignment.findOne({ where: { id: assignmentId, user_id: authResult.user.id } });

    if (!assignment) {
      res.status(403).json({ error: 'Assignment not found or you do not have permission to access it' });
      return;
    }

    // Return assignment details
    res.status(200).json({
      id: assignment.id,
      name: assignment.name,
      points: assignment.points,
      num_of_attempts: assignment.num_of_attempts,
      deadline: assignment.deadline,
      assignment_created: assignment.createdAt,
      assignment_updated: assignment.updatedAt
    });
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ error: 'Error fetching assignment details', message: error.message });
  }
};




// Delete Assignment
const deleteAssignment = async (req, res) => {
  const credentials = basicAuth(req);

  if (!credentials) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const assignmentId = req.params.id;
  const email = credentials.name;
  const providedPassword = credentials.pass;

  if (Object.keys(req.query).length > 0 || (req.body && Object.keys(req.body).length > 0)) {
    res.status(400).send();  // Bad Request if either query parameters or request body present
    return;
  }

  try {
    const authResult = await authenticateUser(email, providedPassword);

    if (authResult.error) {
      res.status(401).json({ error: authResult.error });
      return;
    }

    const user = authResult.user;

    // Ensure the assignment exists and is owned by the authenticated user
    const assignment = await Assignment.findOne({ where: { id: assignmentId, user_id: user.id } });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found or you do not have permission to delete it' });
      return;
    }

    // Delete the assignment
    await assignment.destroy();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Error deleting assignment', message: error.message });
  }
};


// Get List of All Assignments for the Authenticated User
const getAllAssignments = async (req, res) => {
  const credentials = basicAuth(req);

  if (!credentials) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const email = credentials.name;
  const providedPassword = credentials.pass;

  // Check if there are query parameters or request body
  if (Object.keys(req.query).length > 0 || (req.body && Object.keys(req.body).length > 0)) {
    res.status(400).send();  // Bad Request if either query parameters or request body present
    return;
  }

  try {
    const authResult = await authenticateUser(email, providedPassword);

    if (authResult.error) {
      res.status(401).json({ error: authResult.error });
      return;
    }

    // Find all assignments for the authenticated user
    const assignments = await Assignment.findAll({ where: { user_id: authResult.user.id } });

    // if (assignments.length === 0) {
    //   // If there are no assignments for the user, send a 403 Forbidden response
    //   return res.status(403).json({ error: "Forbidden" });
    // }

    // Return assignment details
    const assignmentDetails = assignments.map(assignment => ({
      id: assignment.id,
      name: assignment.name,
      points: assignment.points,
      num_of_attempts: assignment.num_of_attempts,
      deadline: assignment.deadline,
      assignment_created: assignment.createdAt,
      assignment_updated: assignment.updatedAt
    }));

    res.status(200).json(assignmentDetails);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Error fetching assignments', message: error.message });
  }
};


module.exports = {
  createAssignment,
  updateAssignment,
  getAssignmentDetails,
  deleteAssignment,
  getAllAssignments
};