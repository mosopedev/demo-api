const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000;


// Dummy products and customer orders for boox clothing
const fakeDatabase = {
    orders: {
        "1": { id: "1", product_ids: ["201", "202"], total_price: 330, status: "shipped", delivery_date: "2024-09-01" },
        "2": { id: "2", product_ids: ["203"], total_price: 90, status: "processing", delivery_date: null },
        "3": { id: "3", product_ids: ["204", "205"], total_price: 120, status: "delivered", delivery_date: "2024-08-25" },
        "4": { id: "4", product_ids: ["206"], total_price: 45, status: "canceled", delivery_date: null },
        "5": { id: "5", product_ids: ["207", "208", "209"], total_price: 90, status: "processing", delivery_date: null },
        "6": { id: "6", product_ids: ["210"], total_price: 200, status: "shipped", delivery_date: "2024-09-02" },
        "7": { id: "7", product_ids: ["211", "212"], total_price: 205, status: "delivered", delivery_date: "2024-08-30" },
        "8": { id: "8", product_ids: ["213", "214"], total_price: 120, status: "processing", delivery_date: null },
        "9": { id: "9", product_ids: ["215"], total_price: 50, status: "shipped", delivery_date: "2024-09-03" },
        "10": { id: "10", product_ids: ["201", "202", "203"], total_price: 320, status: "canceled", delivery_date: null },
        "11": { id: "11", product_ids: ["204", "205"], total_price: 120, status: "processing", delivery_date: null },
        "12": { id: "12", product_ids: ["206", "207"], total_price: 75, status: "delivered", delivery_date: "2024-08-28" }
    },
    products: {
        "201": { id: "201", name: "Men's Parka Jacket", price: 150, category: "Men's Winter Clothing" },
        "202": { id: "202", name: "Women's Wool Coat", price: 180, category: "Women's Winter Clothing" },
        "203": { id: "203", name: "Kids' Puffer Jacket", price: 90, category: "Kids' Winter Clothing" },
        "204": { id: "204", name: "Men's Thermal Set", price: 50, category: "Men's Winter Clothing" },
        "205": { id: "205", name: "Women's Knitted Sweater", price: 70, category: "Women's Winter Clothing" },
        "206": { id: "206", name: "Kids' Snow Boots", price: 45, category: "Kids' Winter Clothing" },
        "207": { id: "207", name: "Men's Winter Scarf", price: 30, category: "Men's Winter Accessories" },
        "208": { id: "208", name: "Women's Leather Gloves", price: 40, category: "Women's Winter Accessories" },
        "209": { id: "209", name: "Kids' Beanie", price: 20, category: "Kids' Winter Accessories" },
        "210": { id: "210", name: "Men's Down Jacket", price: 200, category: "Men's Winter Clothing" },
        "211": { id: "211", name: "Women's Puffer Jacket", price: 190, category: "Women's Winter Clothing" },
        "212": { id: "212", name: "Kids' Thermal Socks", price: 15, category: "Kids' Winter Accessories" },
        "213": { id: "213", name: "Men's Waterproof Gloves", price: 35, category: "Men's Winter Accessories" },
        "214": { id: "214", name: "Women's Fur-Lined Boots", price: 85, category: "Women's Winter Clothing" },
        "215": { id: "215", name: "Kids' Snow Pants", price: 50, category: "Kids' Winter Clothing" }
    }
};



app.use(express.json());

app.get('/', (req, res) => {
    return res.status(200).json({status: 'active'})
})

// webhook url provided when configuring your business agent
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
            response = createOrder(schemaData.productNames);
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

// Methods to execute the actions
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

const createOrder = (productNames) => {
    const productIds = productNames.map(productName => {
        const product = Object.values(fakeDatabase.products).find(p => p.name.toLowerCase().includes(productName.toLowerCase()));
        return product ? product.id : null;
    }).filter(id => id !== null);

    if (productIds.length > 0) {
        const newOrderId = uuidv4();
        const productsInOrder = productIds.map(id => fakeDatabase.products[id]);
        const totalPrice = productsInOrder.reduce((sum, product) => sum + product.price, 0);

        const newOrder = {
            id: newOrderId,
            product_ids: productIds,
            total_price: totalPrice,
            status: "processing",
            delivery_date: null
        };
        fakeDatabase.orders[newOrderId] = newOrder;
        return { message: "Order created", order: newOrder };
    } else {
        return { message: "No valid products found, cannot create order." };
    }
};

const searchProductsByName = (searchName) => {
    const matchedProducts = Object.values(fakeDatabase.products).filter(p =>
        p.name.toLowerCase().includes(searchName.toLowerCase())
    );
    return matchedProducts.length ? matchedProducts : { message: "No products found matching the search criteria." };
};

app.listen(process.env.PORT || port, '0.0.0.0', () => {
    console.log(`API server running at ${port}`);
});
