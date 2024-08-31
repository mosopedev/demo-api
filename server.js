const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000;

const fakeDatabase = {
    orders: {
        "1": { id: "1", product_id: "101", status: "shipped", delivery_date: "2024-09-01" },
        "2": { id: "2", product_id: "102", status: "processing", delivery_date: null },
        "3": { id: "3", product_id: "103", status: "delivered", delivery_date: "2024-08-25" },
        "4": { id: "4", product_id: "104", status: "canceled", delivery_date: null },
        "5": { id: "5", product_id: "105", status: "processing", delivery_date: null }
    },
    products: {
        "101": { id: "101", name: "Laptop", price: 1200 },
        "102": { id: "102", name: "Phone", price: 800 },
        "103": { id: "103", name: "Tablet", price: 500 },
        "104": { id: "104", name: "Monitor", price: 300 },
        "105": { id: "105", name: "Keyboard", price: 100 }
    }
};

app.use(express.json());

app.post('/webhook', (req, res) => {
    const { action, schemaData } = req.body;

    if (!action || !schemaData) {
        return res.status(400).json({ message: "Invalid request: action and schemaData are required." });
    }

    let response;

    switch (action) {
        case "get_order_by_id":
            response = getOrderById(schemaData.orderId);
            break;
        case "get_product_by_id":
            response = getProductById(schemaData.productId);
            break;
        case "get_delivery_status_by_id":
            response = getDeliveryStatusById(schemaData.orderId);
            break;
        case "cancel_order_by_id":
            response = cancelOrderById(schemaData.orderId);
            break;
        case "create_order":
            response = createOrder(schemaData.productName);
            break;
        case "search_products_by_name":
            response = searchProductsByName(schemaData.searchName);
            break;
        default:
            return res.status(400).json({ message: "Invalid action keyword." });
    }

    if (response) {
        res.json(response);
    } else {
        res.status(404).json({ message: "Resource not found." });
    }
});


const getOrderById = (orderId) => {
    return fakeDatabase.orders[orderId] || null;
};

const getProductById = (productId) => {
    return fakeDatabase.products[productId] || null;
};

const getDeliveryStatusById = (orderId) => {
    const order = fakeDatabase.orders[orderId];
    if (order) {
        return { status: order.status, delivery_date: order.delivery_date };
    }
    return null;
};

const cancelOrderById = (orderId) => {
    const order = fakeDatabase.orders[orderId];
    if (order) {
        if (order.status !== "shipped" && order.status !== "delivered" && order.status !== "canceled") {
            order.status = "canceled";
            return { message: "Order canceled", order };
        } else {
            return { message: "Cannot cancel shipped, delivered, or already canceled order" };
        }
    }
    return null;
};

const createOrder = (productName) => {
    const product = Object.values(fakeDatabase.products).find(p => p.name.toLowerCase() === productName.toLowerCase());

    if (product) {
        const newOrderId = uuidv4();
        const newOrder = {
            id: newOrderId,
            product_id: product.id,
            status: "processing",
            delivery_date: null
        };
        fakeDatabase.orders[newOrderId] = newOrder;
        return { message: "Order created", order: newOrder };
    } else {
        return { message: "Product not found, cannot create order." };
    }
};

const searchProductsByName = (searchName) => {
    const matchedProducts = Object.values(fakeDatabase.products).filter(p =>
        p.name.toLowerCase().includes(searchName.toLowerCase())
    );
    return matchedProducts.length ? matchedProducts : { message: "No products found matching the search criteria." };
};

app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
});
