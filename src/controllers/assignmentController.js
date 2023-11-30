const express = require('express');
const logger = require('../logger/logger');
const client = require('../logger/statsd');

require('dotenv').config();

const { Assignment } = require('../db/db'); // Adjust the path based on your actual structure
const basicAuth = require('basic-auth');
const { User } = require('../db/db');
const { AssignmentSubmission } = require('../db/db');
const bcrypt = require('bcrypt');

const AWS = require("aws-sdk");

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
    logger.warn('Create Assignment: Missing credentials in request');
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const { name, points, num_of_attempts, deadline, assignment_created, assignment_updated } = req.body;

  // Check if required fields are missing
  if (!name || !points || !num_of_attempts || !deadline) {
    logger.warn('Create Assignment: Missing one or more required fields');
    res.status(400).json({ error: 'Bad Request: Missing required fields' });
    return;
  }

  // Check if num_of_attempts and points are integers within the specified range
  if (!Number.isInteger(num_of_attempts) || !Number.isInteger(points) || num_of_attempts < 1 || num_of_attempts > 100 || points < 1 || points > 100) {
    logger.warn(`Create Assignment: num_of_attempts or points out of valid range or not integers. Received num_of_attempts: ${num_of_attempts}, points: ${points}`);
    res.status(400).json({ error: 'Bad Request: Invalid num_of_attempts or points' });
    return;
  }

  // Check if assignment_created or assignment_updated are provided by the user
  if (assignment_created || assignment_updated) {
    logger.warn('Create Assignment: assignment_created or assignment_updated fields provided');
    res.status(403).json({ error: 'Forbidden: Cannot provide assignment_created or assignment_updated' });
    return;
  }

  const email = credentials.name;
  const providedPassword = credentials.pass;

  try {
    const authResult = await authenticateUser(email, providedPassword);

    if (authResult.error) {
      logger.warn(`Create Assignment: Authentication failed for user ${email}`);
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
    // Log successful assignment creation using StatsD
    client.increment('assignment.creation.success', 1);
    logger.info(`Create Assignment: Assignment created successfully for user ${email}`);
    res.status(201).json({ success: true, assignment });
  } catch (error) {
    logger.error(`Create Assignment: Error creating assignment - ${error}`);
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

  // Check if num_of_attempts and points are integers within the specified range
  if (!Number.isInteger(num_of_attempts) || !Number.isInteger(points) || num_of_attempts < 1 || num_of_attempts > 100 || points < 1 || points > 100) {
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

    // Log successful update using StatsD
    client.increment('assignment.update.success', 1);

    logger.info(`Update Assignment: Assignment id ${assignmentId} updated successfully by user ${email}`);
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
      res.status(404).json({ error: 'Assignment not found or you do not have permission to access it' });
      return;
    }

    // Successful retrieval
    client.increment('assignment.details.success', 1);
    logger.info(`Get Assignment Details: Assignment id ${assignmentId} retrieved successfully for user ${email}`);


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
    logger.error(`Get Assignment Details: Error fetching details for assignment id ${assignmentId} - ${error}`);
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
    const assignment = await Assignment.findOne({ where: {id: assignmentId} });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check if the authenticated user is the owner of the assignment
    if (assignment.user_id !== user.id) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    
    // Delete the assignment
    await assignment.destroy();

    client.increment('assignment.delete.success', 1);
    logger.info(`Delete Assignment: Assignment id ${assignmentId} deleted successfully for user ${email}`);


    res.status(204).send();
  } catch (error) {
    logger.error(`Delete Assignment: Error deleting assignment id ${assignmentId} - ${error}`);
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Error deleting assignment', message: error.message });
  }
};




// Get List of All Assignments of all users for the Authenticated User
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
    const assignments = await Assignment.findAll();

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

    client.increment('assignments.getall.success', 1);
    logger.info(`Get All Assignments: Retrieved all assignments for user ${email}`);

    res.status(200).json(assignmentDetails);
  } catch (error) {
    logger.error(`Get All Assignments: Error fetching assignments for user ${email} - ${error}`);
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Error fetching assignments', message: error.message });
  }
};


// POST endpoint for assignment submission
const submitAssignment = async (req, res) => {
  console.log("Submission route handler reached");
  const credentials = basicAuth(req);
 
  if (!credentials) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
 
  const assignmentId = req.params.id;
  const { submission_url } = req.body;
 
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
    const assignment = await Assignment.findOne({ where: {id: assignmentId} });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check if the authenticated user is the owner of the assignment
    if (assignment.user_id !== user.id) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }


 
    // Check if the due date has passed
    const currentDateTime = new Date();
    if (currentDateTime > assignment.deadline) {
      res.status(400).json({ error: "Submission deadline has passed." });
      return;
    }
 
    // Implement retries logic
    const submissions = await AssignmentSubmission.findAll({
      where: { assignment_id: assignmentId, user_id: user.id },
    });
 
    if (submissions.length >= assignment.num_of_attempts) {
      res.status(400).json({ error: "Exceeded maximum number of retries." });
      return;
    }
 
    // Create a new submission
    const submission = await AssignmentSubmission.create({
      assignment_id: assignmentId,
      user_id: user.id,
      submission_url,
      submission_date: new Date(), // Set submission_date to the current date and time
      submission_updated: new Date(), // Set submission_updated to the current date and time
    });
 
    const snsClient = new AWS.SNS({
      apiVersion: "2010-03-31",
      region: "us-east-1", // Replace with your AWS region
      // credentials: new AWS.Credentials({
      //   accessKeyId: "AKIAYI2AV4BT67IR6F3N",
      //   secretAccessKey: "ztcKwhFQXpW+iK4hqq+PM8KoXrobB3WNdGYUbvjT",
      // }),
    });
 
    // Publish message to SNS topic
    const snsMessage = {
      url: submission_url,
      user: {
        email: email,
        // Add other user information if needed
      },
    };

    const topicArn = process.env.TOPIC_ARN;
    
    // const topicsData = await snsClient.listTopics().promise();
    // const topicArn = topicsData.Topics.find(topic => topic.TopicArn.includes('mySNSTopic')).TopicArn;
 
    console.log("topic ARn is = ", topicArn); // successful response

    const snsParams = {
      Message: JSON.stringify(snsMessage),
      TopicArn: topicArn,
    };
 
   

    try {
      const snsResponse = await snsClient.publish(snsParams).promise();
      console.log("Message published to SNS:", snsResponse.MessageId);
      // // Optionally, you can subscribe an email address to the SNS topic
      // const endpoint = email; // Replace with your endpoint
      // const protocol = 'email'; // Change to 'sms', 'https', etc., as needed

      // snsClient.subscribe(
      // {
      //   TopicArn: topicArn, // The ARN of the SNS topic created in step 3
      //   Protocol: protocol,
      //   Endpoint: endpoint,
      // }, (err, data) => {
      //   if (err) {
      //     console.error('Error subscribing to topic:', err);
      //   } else {
      //     console.log('Subscription ARN:', data.SubscriptionArn);
      //   }
      // });

    } catch (error) {
      console.error("Error publishing message to SNS:", error);
      // Handle error as needed
    }
 
    // Log successful submission
    client.increment("assignment.submission.success", 1);
    logger.info(
      `Assignment Submission: Submission for assignment id ${assignmentId} by user ${email} accepted`
    );
 
    res.status(201).json({ success: true, submission });
  } catch (error) {
    logger.error(
      `Assignment Submission: Error submitting assignment id ${assignmentId} - ${error}`
    );
    console.error("Error submitting assignment:", error);
    res
      .status(500)
      .json({ error: "Error submitting assignment", message: error.message });
  }
};
 



module.exports = {
  createAssignment,
  updateAssignment,
  getAssignmentDetails,
  deleteAssignment,
  getAllAssignments,
  submitAssignment
};