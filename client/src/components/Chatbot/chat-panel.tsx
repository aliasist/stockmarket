import * as React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
// Removed PromptForm and ButtonScrollToBottom imports (no longer used)
import { IconShare } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'

// TODO: Replace with your actual backend API endpoint
const CHAT_API_ENDPOINT = '/api/chat';

export interface ChatPanelProps {
	id?: string
	title?: string
	input: string
	setInput: (value: string) => void
	isAtBottom: boolean
	scrollToBottom: () => void
}

export function ChatPanel({
	id,
	title,
	input,
	setInput,
	isAtBottom,
	scrollToBottom
}: ChatPanelProps) {
	const [messages, setMessages] = React.useState<any[]>([])
	const [loading, setLoading] = React.useState(false)

	// Example: useEffect to load initial messages if needed
	// React.useEffect(() => {
	//   fetch('/api/chat/history').then(...)
	// }, [])

	const exampleMessages = [
		{
			heading: 'What is the price',
			subheading: 'of Apple Inc.?',
			message: 'What is the price of Apple stock?'
		},
		{
			heading: 'Show me a stock chart',
			subheading: 'for $GOOGL',
			message: 'Show me a stock chart for $GOOGL'
		},
		{
			heading: 'What are some recent',
			subheading: `events about Amazon?`,
			message: `What are some recent events about Amazon?`
		},
		{
			heading: `What are Microsoft's`,
			subheading: 'latest financials?',
			message: `What are Microsoft's latest financials?`
		},
		{
			heading: 'How is the stock market',
			subheading: 'performing today by sector?',
			message: `How is the stock market performing today by sector?`
		},
		// ...add more examples as needed
	]

	// Example handler for sending a message
	const handleSend = async (userInput: string) => {
		if (!userInput.trim()) return;
		setLoading(true);
		setMessages(prev => [...prev, { role: 'user', content: userInput }]);
		try {
			const res = await fetch(CHAT_API_ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: userInput })
			});
			const data = await res.json();
			setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
		} catch (err) {
			setMessages(prev => [...prev, { role: 'bot', content: 'Error: Could not get response.' }]);
		}
		setLoading(false);
	};

	// UI rendering (stubbed)
	return (
		<div>
			<div>
				{messages.map((msg, idx) => (
					<div key={idx} style={{ margin: '8px 0' }}>
						<strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
					</div>
				))}
			</div>
			<div>
				<input
					type="text"
					value={input}
					onChange={e => setInput(e.target.value)}
					disabled={loading}
					placeholder="Type your message..."
				/>
				<button onClick={() => handleSend(input)} disabled={loading || !input.trim()}>
					Send
				</button>
			</div>
		</div>
	)

}