'use client'


import { useState } from 'react'
import { ChatPanel } from '@/components/Chatbot/chat-panel'


// Minimal ChatProps for compatibility
export interface ChatProps extends React.ComponentProps<'div'> {
	id?: string
}

export function Chat({ id }: ChatProps) {
	const [input, setInput] = useState('')

	return (
		<div>
			<ChatPanel
				id={id}
				title={"Groq AI Chat"}
				input={input}
				setInput={setInput}
				isAtBottom={true}
				scrollToBottom={() => {}}
			/>
		</div>
	)
}