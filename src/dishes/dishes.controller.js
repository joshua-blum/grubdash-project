const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//validation start
const validateData = (req,res,next) => {
    const {data: {name, description, price, image_url} = {}} = req.body;
    if(!name) return next({status: 400, message: 'Dish must include a name'});
    if (!description) {
        return next({ status: 400, message: `Dish must include a description` });
      }
      if (Number(price) <= 0 || typeof price != "number") {
        return next({ status: 400, message: `Dish must include a price` });
      }
      if (!image_url) {
        return next({ status: 400, message: `Dish must include a image_url` });
      }
      res.locals.dish = req.body.data;
      next();
}

const hasValidDish = (req,res,next) => {
    const foundDish = dishes.find((dish) => dish.id === req.params.dishId);
    if(foundDish) {
        res.locals.dish = foundDish;
        return next();
    } return next({
        status: 404,
        message: `Dish with id ${req.params.dishId} not found`
    });
}

const idMatchesRouteAndUrl = (req,res,next) => {
    if(req.body.data.id && req.body.data.id !== req.params.dishId){
        return next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${req.params.dishId}`
        });
    } next();
}

//validation end

//handlers start

//post /dishes
const create = (req,res,next) => {
    const newDish = {
        ...res.locals.dish,
        id: nextId()
    };
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}

//get /dishes/:dishId
const read = (req,res,next) => {
    res.status(200).json({data: res.locals.dish});
}

const update = (req,res,next) => {
    const updatedDish = req.body.data;
    const index = dishes.findIndex((dish) => dish.id === updatedDish.id);
    if(!updatedDish.id) updatedDish.id = req.params.dishId;
    dishes[index] = updatedDish;
    res.status(200).json({data: updatedDish});
}

//get /dishes
const list = (req,res, next) => {
    res.status(200).json({data: dishes})
}

module.exports = {
    create: [validateData, create],
    read: [hasValidDish, read],
    update: [hasValidDish, validateData, idMatchesRouteAndUrl, update],
    list
}