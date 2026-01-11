
export interface ItemTemplate {
    id: string;
    category: string;
    estimatedWeightLb: number;
    shippingCostUsd: number;
}

export const ITEM_TEMPLATES: ItemTemplate[] = [
    { 
        id: 'phone',
        category: 'Phone', 
        estimatedWeightLb: 0.6, 
        shippingCostUsd: 30 
    },
    { 
        id: 'tablet',
        category: 'Tablet', 
        estimatedWeightLb: 1.0, 
        shippingCostUsd: 40 
    },
    { 
        id: 'laptop',
        category: 'Laptop', 
        estimatedWeightLb: 4.0, 
        shippingCostUsd: 50 
    },
    { 
        id: 'gaming-laptop',
        category: 'Gaming Laptop', 
        estimatedWeightLb: 8.0, 
        shippingCostUsd: 70 
    },
    { 
        id: 'accessory',
        category: 'Accessory', 
        estimatedWeightLb: 0.3, 
        shippingCostUsd: 20 
    },
];
