const products = [{ name: "Aspirin", total_stock: 0 }, { name: "Tylenol", total_stock: "0" }, { name: "Advil", quantity: 0 }, { name: "Ibuprofen" }];
const getStock = p => p.total_stock ?? 0;
const filtered = products.filter(p => ("".includes("")) && getStock(p) > 0);
console.log(filtered);
