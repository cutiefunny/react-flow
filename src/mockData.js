// Mock Data for Development Testing
// This file contains sample data for scenarios, templates, and settings
// Later, these functions can be replaced with real API calls

export const MOCK_SCENARIOS = [
  {
    id: 'scenario-001',
    name: 'Customer Support Flow',
    job: 'Support',
    description: 'A typical customer support chatbot flow for handling common queries.',
    category_id: 'DEV_1000_S_1_1_1',
    nodes: [
      {
        id: 'start-001',
        data: { label: 'Start' },
        position: { x: 100, y: 100 },
        type: 'input',
      },
      {
        id: 'message-001',
        data: { label: 'Welcome Message' },
        position: { x: 100, y: 200 },
        type: 'message',
      },
      {
        id: 'end-001',
        data: { label: 'End' },
        position: { x: 100, y: 300 },
        type: 'output',
      },
    ],
    edges: [
      { id: 'edge-1', source: 'start-001', target: 'message-001' },
      { id: 'edge-2', source: 'message-001', target: 'end-001' },
    ],
    start_node_id: 'start-001',
    created_at: new Date('2024-01-15').toISOString(),
    updated_at: new Date('2024-01-20').toISOString(),
    last_used_at: new Date('2024-01-25').toISOString(),
  },
  {
    id: 'scenario-002',
    name: 'Order Processing Flow',
    job: 'Order',
    description: 'Order processing and tracking flow for e-commerce platforms.',
    category_id: 'DEV_1000_S_1_1_1',
    nodes: [
      {
        id: 'start-002',
        data: { label: 'Order Start' },
        position: { x: 100, y: 100 },
        type: 'input',
      },
      {
        id: 'message-002',
        data: { label: 'Enter Order ID' },
        position: { x: 100, y: 200 },
        type: 'message',
      },
      {
        id: 'end-002',
        data: { label: 'End' },
        position: { x: 100, y: 300 },
        type: 'output',
      },
    ],
    edges: [
      { id: 'edge-3', source: 'start-002', target: 'message-002' },
      { id: 'edge-4', source: 'message-002', target: 'end-002' },
    ],
    start_node_id: 'start-002',
    created_at: new Date('2024-02-01').toISOString(),
    updated_at: new Date('2024-02-05').toISOString(),
    last_used_at: new Date('2024-02-08').toISOString(),
  },
  {
    id: 'scenario-003',
    name: 'Product Inquiry Flow',
    job: 'Product',
    description: 'Product information and inquiry handling flow.',
    category_id: 'DEV_1000_S_1_1_1',
    nodes: [],
    edges: [],
    start_node_id: null,
    created_at: new Date('2024-02-10').toISOString(),
    updated_at: new Date('2024-02-10').toISOString(),
    last_used_at: null,
  },
];

export const MOCK_API_TEMPLATES = [
  {
    id: 'api-template-001',
    name: 'Weather API',
    description: 'Get weather information',
    url: 'https://api.weather.com/v1/forecast',
    method: 'GET',
    headers: '{"Authorization": "Bearer YOUR_API_KEY"}',
    body: '{}',
  },
  {
    id: 'api-template-002',
    name: 'Customer Lookup',
    description: 'Look up customer information',
    url: 'http://localhost:8000/api/customers/{customerId}',
    method: 'GET',
    headers: '{"Content-Type": "application/json"}',
    body: '{}',
  },
  {
    id: 'api-template-003',
    name: 'Create Order',
    description: 'Create a new order',
    url: 'http://localhost:8000/api/orders',
    method: 'POST',
    headers: '{"Content-Type": "application/json"}',
    body: '{"customerId": "", "items": [], "total": 0}',
  },
];

export const MOCK_FORM_TEMPLATES = [
  {
    id: 'form-template-001',
    name: 'Customer Feedback Form',
    description: 'Collect customer feedback',
    fields: [
      { id: 'field-1', label: 'Name', type: 'text', required: true },
      { id: 'field-2', label: 'Email', type: 'email', required: true },
      { id: 'field-3', label: 'Feedback', type: 'textarea', required: true },
      { id: 'field-4', label: 'Rating', type: 'number', required: false },
    ],
  },
  {
    id: 'form-template-002',
    name: 'Order Information Form',
    description: 'Collect order details',
    fields: [
      { id: 'field-5', label: 'Order ID', type: 'text', required: true },
      { id: 'field-6', label: 'Product Name', type: 'text', required: true },
      { id: 'field-7', label: 'Quantity', type: 'number', required: true },
      { id: 'field-8', label: 'Delivery Address', type: 'textarea', required: true },
    ],
  },
];

export const MOCK_NODE_VISIBILITY = {
  visibleNodeTypes: [
    'message',
    'apiNode',
    'formNode',
    'branchNode',
    'delayNode',
    'setSlotNode',
    'slotFillingNode',
    'fixedMenuNode',
    'linkNode',
    'iframeNode',
    'toastNode',
    'llmNode',
  ],
};

export const MOCK_NODE_COLORS = {
  message: '#4A90E2',
  apiNode: '#7ED321',
  formNode: '#F5A623',
  branchNode: '#BD10E0',
  delayNode: '#50E3C2',
  setSlotNode: '#B8E986',
  slotFillingNode: '#FF6B6B',
  fixedMenuNode: '#4ECDC4',
  linkNode: '#FFE66D',
  iframeNode: '#95E1D3',
  toastNode: '#AA96DA',
  llmNode: '#FCBAD3',
  input: '#417505',
  output: '#000000',
};

export const MOCK_NODE_TEXT_COLORS = {
  message: '#FFFFFF',
  apiNode: '#FFFFFF',
  formNode: '#FFFFFF',
  branchNode: '#FFFFFF',
  delayNode: '#FFFFFF',
  setSlotNode: '#FFFFFF',
  slotFillingNode: '#FFFFFF',
  fixedMenuNode: '#FFFFFF',
  linkNode: '#000000',
  iframeNode: '#000000',
  toastNode: '#FFFFFF',
  llmNode: '#000000',
  input: '#FFFFFF',
  output: '#FFFFFF',
};

// Helper function to add timestamps
export const addTimestamps = (data) => ({
  ...data,
  created_at: data.created_at || new Date().toISOString(),
  updated_at: data.updated_at || new Date().toISOString(),
});

// Helper function to delay for realistic async behavior
export const delay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));
