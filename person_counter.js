


const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')

const pixelUtil = require('pixel-util')
const Canvas = require('canvas')
const { createCanvas, loadImage } = require('canvas')
const coco_ssd = require('@tensorflow-models/coco-ssd')
const axios = require('axios')

const port = 7373;

var model = undefined;

function load_model(){

  console.log("[TF] Loading model...");

  coco_ssd.load()
  .then(result => {
    model = result
    console.log("[TF] Model loaded");
  })
  .catch(error => {
    console.log(`[TF] error loading model: ${error}`)
  })
}


function process_predictions(predictions) {
  const SCORE_THRESHOLD = 0.5
  var person_count = 0
  predictions.forEach( prediction => {
    if(prediction.class === 'person' && prediction.score) {
      person_count ++
    }
  });
  return person_count

}



const app = express();
app.use(bodyParser.json());
app.use(cors());


app.get('/', (req, res) => {
  res.send("Hi!")
})


app.post('/predict', (req, res) => {
  if(!model) return res.status(500).send('Model has not been loaded')
  if(!req.body.url) return res.status(500).send('URL not specified')

  console.log(`Request for ${req.body.url}`)

  console.log(`Downloading image ${req.body.url}`)
  var image = new Canvas.Image;
  pixelUtil.createBuffer(req.body.url)
  .then((buffer) => {

    image.src = buffer;

    // Create canvas
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    console.log(`Download complete, image is  ${image.width}x${image.height}`)

    console.log(`Predicting...`)
    model.detect(canvas)
    .then(predictions => {
      var processed_predictions = process_predictions(predictions)
      console.log(`Prediction: ${processed_predictions}`)
      res.send({person_count: processed_predictions})
    })
    .catch(error => {
      res.status(500).send(`Error while predicting: ${error}`)
    })
  })
  .catch(error => {
    console.log(`Error while fetching image: ${error}`)
    res.status(500).send(`Error while fetching image: ${error}`)
  })

})


app.listen(port, () => {
  console.log(`Person counter listening on port ${port}!`)
})

load_model()
