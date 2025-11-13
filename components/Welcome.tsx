import React from 'react';
import { CodeBracketIcon, ChatBubbleIcon, DashboardIcon, ImageIcon, VideoIcon, LinkIcon, MicrophoneIcon, PlusIcon } from './icons';

const ActionCard: React.FC<{ Icon: React.ElementType; title: string; }> = ({ Icon, title }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center space-x-4 hover:bg-gray-700 transition-colors cursor-pointer">
        <Icon className="w-6 h-6 text-gray-400" />
        <span className="text-white font-medium">{title}</span>
    </div>
);

const WhatsNewCard: React.FC<{ Icon: React.ElementType; title: string; description: string; }> = ({ Icon, title, description }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer">
        <div className="flex items-center space-x-3 mb-2">
            <Icon className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <p className="text-sm text-gray-400">{description}</p>
    </div>
);

const Welcome: React.FC = () => {
    const pythonCode = `from google import genai

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain how AI works in a few words",
)

print(response.text)`;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Google AI Studio</h1>
                    <p className="text-gray-400 mt-1">The fastest way from prompt to production with Gemini</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md flex items-center space-x-2">
                    <PlusIcon className="w-5 h-5" />
                    <span>New app</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <ActionCard Icon={CodeBracketIcon} title="Vibe code GenAI apps" />
                <ActionCard Icon={ChatBubbleIcon} title="Chat with models" />
                <ActionCard Icon={DashboardIcon} title="Monitor usage and projects" />
            </div>

            <h2 className="text-xl font-semibold text-white mb-4">What's new</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <WhatsNewCard Icon={ImageIcon} title="Try Nano Banana" description="State-of-the-art image generation and editing" />
                <WhatsNewCard Icon={VideoIcon} title="Veo 3.1" description="Our best video generation model, now with sound effects." />
                <WhatsNewCard Icon={LinkIcon} title="Try the URL context tool" description="Fetch real-time information from web links" />
                <WhatsNewCard Icon={MicrophoneIcon} title="Text to speech with Gemini" description="Generate high-quality text to speech with Gemini" />
            </div>

            <div>
                 <h2 className="text-xl font-semibold text-white mb-4">Get started with Gemini</h2>
                 <div className="bg-gray-800 border border-gray-700 rounded-lg">
                    <div className="p-4 border-b border-gray-700">
                        <select className="bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Python</option>
                            <option>Node.js</option>
                            <option>cURL</option>
                        </select>
                    </div>
                    <div className="p-4 bg-black/50 rounded-b-lg">
                        <pre className="text-sm text-gray-300 overflow-x-auto">
                            <code className="language-python">{pythonCode}</code>
                        </pre>
                    </div>
                 </div>
                 <div className="mt-4 flex justify-end space-x-4">
                     <button className="text-sm font-semibold text-blue-400 hover:underline">View API keys</button>
                     <button className="text-sm font-semibold text-blue-400 hover:underline">Explore docs</button>
                 </div>
            </div>

        </div>
    );
};

export default Welcome;
