import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { HiOutlineCalendar, HiOutlineEnvelope, HiOutlineDocument, HiOutlineXMark } from "react-icons/hi2";

export interface ContextItem {
    id: string;
    type: 'email' | 'calendar' | 'document';
    title: string;
    content: string;
    timestamp: Date;
    metadata: {
        score: number;
    };
}

interface ContextPanelProps {
    items: ContextItem[];
}

export default function ContextPanel({ items }: ContextPanelProps) {
    const [selectedItem, setSelectedItem] = useState<ContextItem | null>(null);

    const parseDocumentContent = (item: ContextItem) => {
        const content = item.content;

        if (content.includes('Subject:') && content.includes('From:')) {
            const parsed = {
                subject: content.match(/Subject:\s*([^\n]+)/)?.[1]?.trim() || 'No Subject',
                from: content.match(/From:\s*([^\n]+)/)?.[1]?.trim() || '',
                date: content.match(/Date:\s*([^\n]+)/)?.[1]?.trim() || '',
                content: content.match(/Content:\s*([\s\S]+)$/)?.[1]?.trim() || ''
            };

            return {
                type: 'email' as const,
                title: parsed.subject,
                formattedContent: `**From:** ${parsed.from}

**Date:** ${parsed.date}

---

${parsed.content}`
            };
        }

        if (content.includes('Event:')) {
            const parsed = {
                title: content.match(/Event:\s*([^\n]+)/)?.[1]?.trim() || 'Untitled Event',
                date: content.match(/Date:\s*([^\n]+)/)?.[1]?.trim() || '',
                end: content.match(/End:\s*([^\n]+)/)?.[1]?.trim() || '',
                location: content.match(/Location:\s*([^\n]+)/)?.[1]?.trim() || '',
                attendees: content.match(/Attendees:\s*([^\n]+)/)?.[1]?.split(',').map(a => a.trim()) || []
            };

            return {
                type: 'calendar' as const,
                title: parsed.title,
                formattedContent: `**📅 Date & Time**
${parsed.date}${parsed.end ? ` - ${parsed.end}` : ''}

**📍 Location**
${parsed.location || 'No location specified'}

**👥 Attendees**
${parsed.attendees.map(a => `- ${a}`).join('\n')}`
            };
        }

        return {
            type: 'document' as const,
            title: 'Document',
            formattedContent: content
        };
    };

    const getDocumentIcon = (item: ContextItem) => {
        const parsed = parseDocumentContent(item);
        switch (parsed.type) {
            case 'calendar':
                return <HiOutlineCalendar className="w-4 h-4 text-[#22886c]" />;
            case 'email':
                return <HiOutlineEnvelope className="w-4 h-4 text-[#22886c]" />;
            default:
                return <HiOutlineDocument className="w-4 h-4 text-[#22886c]" />;
        }
    };

    return (
        <div className="bg-[#0f2c24] rounded-lg p-6 border-2 border-[#22886c]/20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <span>📎</span> Context
            </h2>
            
            <div className="space-y-2">
                {items.map(item => {
                    const parsed = parseDocumentContent(item);
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setSelectedItem(item)}
                            className="p-4 border border-[#22886c]/20 rounded-lg bg-[#071b16] cursor-pointer transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="mt-1">
                                        {getDocumentIcon(item)}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-sm leading-5 text-white">
                                            {parsed.title}
                                        </h3>
                                        <p className="text-xs text-white/50 mt-1">
                                            Relevance: {(item.metadata.score * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-white/50 shrink-0 ml-4">
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0f2c24] rounded-lg w-full max-w-2xl overflow-hidden shadow-xl border-2 border-[#22886c]/20"
                        >
                            <div className="p-6 border-b border-[#22886c]/20">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {getDocumentIcon(selectedItem)}
                                        <h2 className="text-xl font-semibold text-white">
                                            {parseDocumentContent(selectedItem).title}
                                        </h2>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedItem(null)}
                                        className="text-white/50 hover:text-white"
                                    >
                                        <HiOutlineXMark className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 prose prose-invert prose-sm max-w-none text-white/90">
                                <ReactMarkdown>
                                    {parseDocumentContent(selectedItem).formattedContent}
                                </ReactMarkdown>
                            </div>

                            <div className="p-6 border-t border-[#22886c]/20 flex justify-end">
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="px-4 py-2 bg-[#071b16] text-white border-2 border-[#22886c]/20 rounded-lg"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};