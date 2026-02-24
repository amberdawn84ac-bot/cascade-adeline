import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

// Load environment variables
dotenv.config();

async function testOpenAI() {
  try {
    console.log('Testing OpenAI with API key:', process.env.OPENAI_API_KEY ? 'Key exists' : 'No key found');
    
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
    });
    
    const response = await model.invoke([
      new HumanMessage({ content: 'Hello, can you respond with "OpenAI is working"?' })
    ]);
    
    console.log('OpenAI Response:', response.content);
  } catch (error) {
    console.error('OpenAI Error:', error.message);
  }
}

testOpenAI();
