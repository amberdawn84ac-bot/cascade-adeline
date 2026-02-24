import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

async function testOpenAI() {
  try {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
    });
    
    const response = await model.invoke([
      new HumanMessage({ content: 'Hello, can you respond with "OpenAI is working"?' })
    ]);
    
    console.log('OpenAI Response:', response.content);
  } catch (error) {
    console.error('OpenAI Error:', error);
  }
}

testOpenAI();
