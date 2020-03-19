


const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
const { createCanvas, loadImage } = require('canvas')
const formidable = require('formidable')
var coco_ssd = require('@tensorflow-models/coco-ssd')

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

app.get('/upload_form', (req, res) => {
  res.sendFile(path.join(__dirname, 'upload_form.html'));
})

app.post('/predict', (req, res) => {
  if(!model) return res.status(500).send('Model has not been loaded')

  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if(err) return res.status(500).send(`Error parsing form: ${err}`)

    if(!files.image) return res.status(500).send('Image not present in form')
    loadImage(files.image.path)
    .then((image) => {

      // Create canvas
      const canvas = createCanvas(image.width, image.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

      model.detect(canvas)
      .then(predictions => {
        res.send({person_count: process_predictions(predictions)})
      })
      .catch(error => {res.status(500).send(`Error while predicting: ${error}`)})
    })
    .catch(error => {res.status(500).send(`Error while loading the image: ${error}`)})

  })


})


app.listen(port, () => {
  console.log(`Person counter listening on port ${port}!`)
})

load_model()
