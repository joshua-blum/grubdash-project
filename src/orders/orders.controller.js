const path = require("path");


// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//validation start
const validateData = (req,res,next) => {
    const {data: {deliverTo, mobileNumber, dishes, quantity} = {}} = req.body;
    if(!deliverTo || deliverTo === "") return next({
        status:400,
        message: "Order must include a deliverTo"
    });
    if(!mobileNumber || mobileNumber === "") return next({
        status:400,
        message: 'Order must include a mobileNumber'
    });
    if(!dishes) return next({
        status: 400,
        message: 'Order must include a dish'
    });
    if(!Array.isArray(dishes) || dishes.length <= 0) return next({
        status: 400,
        message: 'Order must include at least one dish'
    });

    dishes.forEach((dish) => {
        if(!dish.quantity || !Number.isInteger(dish.quantity) || dish.quantity <= 0) return next({
            status: 400,
            message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`
        })
    });
    next();
}

const isValidOrder = (req,res,next) => {
    const {orderId} = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);

    if(!foundOrder) return next({
        status: 404,
        message: `Order does not exist: ${orderId}`
    })

    if(!foundOrder.status || foundOrder.status === undefined || foundOrder.status === "") next({
        status:404,
        message: 'Order must have a status of pending, preparing, out-for-delivery, delivered'
    });
    if(foundOrder.status === 'delivered') next({
        status:404,
        message: 'A delivered order cannot be changed'
    });

    const {id} = req.body;
    if(id && id !== orderId) next({
        status:404,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    })
    res.locals.order = foundOrder;
    next();
}

const idMatchesRouteandUrl = (req,res,next) => {
    if(req.body.data.id && req.body.data.id != req.params.orderId) return next({
        status: 400,
        message: `Order id does not match route id. Order: ${req.body.data.id}, Route: ${req.params.orderId}}`
    });
    next();
}

const hasValidOrderStatus = (req,res,next) => {
    const {data: {status} = {}} = req.body;

    if(!status || status === "" || status === 'invalid') return next({
        status: 400,
        message: 'Order must have a status of pending, preparing, out-for-delivery, delivered'
    });

    if(status === 'delivered') return next({
        status: 400,
        message: 'A delivered order cannot be changed'
    });

    const {id} = req.body;
    if(id && id !== orderId) return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    })

    next();
}

// only to help delete /orders/:orderId
const isPending = (req,res,next) => {
    if(res.locals.order.status !== 'pending') return next({
        status: 400,
        message: 'An order cannot be deleted unless it is pending'
    })
    next();
}

//validation end

//crudl start
const create = (req,res,next) => {
    const newOrder = {...req.body.data, id: nextId()};
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
};

const read = (req,res,next) => {
    res.status(200).json({data: res.locals.order});
}

const update = (req,res,next) => {
    const updatedOrder = req.body.data;
    const index = orders.findIndex((order) => order.id === updatedOrder.id);
    if(!updatedOrder.id) updatedOrder.id = req.params.orderId;
    orders[index] = updatedOrder;
    res.status(200).json({data: updatedOrder});
}

const destroy = (req,res,next) => {
    const {orderId} = req.params;
    const index = orders.findIndex((order) => order.id === Number(orderId));
    orders.splice(index,1);
    res.sendStatus(204).json({data: req.body.data});
}

const list = (req,res,next) => {
    res.status(200).json({data: orders});
}
//crudl end

module.exports = {
    create: [validateData, create],
    read: [isValidOrder, read],
    update: [isValidOrder, validateData, hasValidOrderStatus, idMatchesRouteandUrl, update],
    delete: [isValidOrder, isPending, destroy],
    list,
}
