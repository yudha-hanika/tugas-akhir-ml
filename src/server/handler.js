const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../servicekey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const predictClassification = require("../services/inferenceServices");

const postPredictHandler = async (request, h) => {
  const { image } = request.payload;
  const { model } = request.server.app;

  const { result, suggestion } = await predictClassification(model, image);

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const newPrediction = {
    id,
    result,
    suggestion,
    createdAt,
  };

  // Store data in Firestore
  await db.collection('predictions').doc(id).set(newPrediction);

  const response = h
    .response({
      status: "success",
      message: "Model is predicted successfully",
      data: newPrediction,
    })
    .code(201);

  return response;
};

const getPredictHistoriesHandler = async (request, h) => {
  const snapshot = await db.collection('predictions').get();
  const histories = snapshot.docs.map(doc => doc.data());

  const formattedHistories = histories.map((data) => ({
    id: data.id,
    history: {
      result: data.result,
      createdAt: data.createdAt,
      suggestion: data.suggestion,
      id: data.id,
    },
  }));

  const response = h.response({
    status: "success",
    data: formattedHistories,
  });

  return response;
};

module.exports = { postPredictHandler, getPredictHistoriesHandler };
