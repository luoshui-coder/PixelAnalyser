'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendIcon, DownloadIcon, PlusIcon, XIcon, SettingsIcon, EditIcon, TrashIcon, Github } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// 定义更具体的类型
type Image = {
  id: string;
  url: string;
  name: string;
}

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
}

// 新增的错误处理函数
const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return `API请求失败: ${error.message}`;
  }
  return '发生未知错误';
}

// 新增的加密函数（示例）
const encryptApiKey = (key: string): string => {
  // 这里应该使用真正的加密算法
  return btoa(key);
}

// 新增的解密函数（示例）
const decryptApiKey = (encryptedKey: string): string => {
  // 这里应该使用真正的解密算法
  return atob(encryptedKey);
}

// 新增辅助函数
const getBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function PixelSageAppleStyle() {
  const [images, setImages] = useState<Image[]>([])
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://open.bigmodel.cn/api/paas/v4')
  const [isLoading, setIsLoading] = useState(false)
  const [prompts, setPrompts] = useState<string[]>([
    "描述图片的主要内容",
    "识别并解释图中的文字",
    "分析图片中的主要颜色和色调",
    "识别图片中的主要物体或人物",
    "描述图片中的场景和氛围",
    "分析图片的构图和色彩",
    "解释图片可能传达的情感或信息",
    "比较图片中的前景和背景元素",
    "推测这张图片的拍摄时间和地点",
    "识别并解释图片中的任何符号或隐喻"
  ])
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null)
  const [editingPromptValue, setEditingPromptValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState(0)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 在客户端加载时从 localStorage 获取数据
    if (typeof window !== 'undefined') {
      const storedApiKey = localStorage.getItem('encryptedApiKey');
      if (storedApiKey) {
        setApiKey(decryptApiKey(storedApiKey));
      }
      setBaseUrl(localStorage.getItem('baseUrl') || 'https://open.bigmodel.cn/api/paas/v4')
      
      const savedPrompts = localStorage.getItem('savedPrompts');
      if (savedPrompts) {
        setPrompts(JSON.parse(savedPrompts));
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // 如果canvas不存在，直接返回
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // 如果无法获取2d上下文，直接返回

    let animationFrameId: number | null = null;

    const drawGradient = (t: number) => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, `hsl(${(t / 100) % 360}, 70%, 90%)`)
      gradient.addColorStop(0.5, `hsl(${((t / 100) + 60) % 360}, 70%, 90%)`)
      gradient.addColorStop(1, `hsl(${((t / 100) + 120) % 360}, 70%, 90%)`)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      animationFrameId = requestAnimationFrame(() => drawGradient(t + 1))
    }

    drawGradient(0)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const img = document.createElement('img')
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              if (ctx) {
                canvas.width = img.width
                canvas.height = img.height

                // Apply Gaussian blur
                ctx.filter = 'blur(3px)'
                ctx.drawImage(img, 0, 0, img.width, img.height)
                ctx.filter = 'none'

                // Draw the original image on top with reduced opacity for soft edges
                ctx.globalAlpha = 0.9
                ctx.drawImage(img, 0, 0, img.width, img.height)

                const softEdgeImage = canvas.toDataURL()
                setImages(prevImages => [...prevImages, {
                  id: Math.random().toString(36).substr(2, 9),
                  url: softEdgeImage,
                  name: file.name
                }])
              } else {
                console.error('无法获取 canvas 上下文')
              }
            } catch (error) {
              console.error('处理图像时出错:', error)
            }
          }
          img.onerror = () => {
            console.error('加载图像失败')
          }
          img.src = e.target?.result as string
        } catch (error) {
          console.error('创建图像元素时出错:', error)
        }
      }
      reader.onerror = () => {
        console.error('读取文件失败')
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleDeleteImage = (id: string) => {
    setImages(prevImages => prevImages.filter(image => image.id !== id))
  }

  const handleChatSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (message.trim() && images.length > 0) {
      const promptText = message.trim();
      setMessage('');
      setChatHistory(prev => [...prev, { role: 'user', content: promptText }]);
      setIsLoading(true);
      setProgress(0);

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        try {
          const imageBase64 = await getBase64(image.url);
          const base64Data = imageBase64.split(',')[1];

          const requestBody = {
            model: "glm-4v",
            messages: [
              { 
                role: "user", 
                content: [
                  { type: "text", text: promptText },
                  { type: "image_url", image_url: { "url": `data:image/jpeg;base64,${base64Data}` } }
                ]
              }
            ],
            stream: true
          };

          const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let assistantMessage = '';

          if (reader) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: `图片 "${image.name}" 的分析：\n` }]);
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content || '';
                    if (content) {
                      assistantMessage += content;
                      setChatHistory(prev => {
                        const newHistory = [...prev];
                        const lastMessage = newHistory[newHistory.length - 1];
                        lastMessage.content = `图片 "${image.name}" 的分析：\n${assistantMessage}`;
                        return newHistory;
                      });
                    }
                  } catch (error) {
                    console.error('解析时出错:', error);
                  }
                }
              }
            }
          }

          setProgress(Math.round(((i + 1) / images.length) * 100));

          // 在每次更新chatHistory后，确保滚动到底部
          if (chatContainerRef.current) {
            setTimeout(() => {
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
              }
            }, 0);
          }

        } catch (error) {
          console.error(`处理图片 "${image.name}" 时出错:`, error);
          setChatHistory(prev => [...prev, { role: 'assistant', content: handleApiError(error) }]);
        }
      }
      setIsLoading(false);
      setProgress(100);
    } else if (images.length === 0) {
      alert('请先上传图片');
    }
  };

  const handlePromptClick = async (promptText: string) => {
    if (images.length === 0) {
      alert('请先上传图片')
      return
    }
    setMessage(promptText)
    setChatHistory(prev => [...prev, { role: 'user', content: promptText }])
    setIsLoading(true)
    setProgress(0)

    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      try {
        const imageBase64 = await getBase64(image.url)
        const base64Data = imageBase64.split(',')[1]

        const requestBody = {
          model: "glm-4v",
          messages: [
            { 
              role: "user", 
              content: [
                { type: "text", text: promptText },
                { type: "image_url", image_url: { "url": `data:image/jpeg;base64,${base64Data}` } }
              ]
            }
          ],
          stream: true
        }

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let assistantMessage = ''

        if (reader) {
          setChatHistory(prev => [...prev, { role: 'assistant', content: `图片 "${image.name}" 的分析：\n` }])
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices[0]?.delta?.content || ''
                  if (content) {
                    assistantMessage += content
                    setChatHistory(prev => {
                      const newHistory = [...prev]
                      const lastMessage = newHistory[newHistory.length - 1]
                      lastMessage.content = `图片 "${image.name}" 的分析：\n${assistantMessage}`
                      return newHistory
                    })
                  }
                } catch (error) {
                  console.error('析时出错:', error)
                }
              }
            }
          }
        }

        setProgress(Math.round(((i + 1) / images.length) * 100))

        // 在每次更新chatHistory后，确保滚动到底部
        if (chatContainerRef.current) {
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
          }, 0);
        }

      } catch (error: unknown) {
        console.error(`处理图片 "${image.name}" 时出错:`, error)
        setChatHistory(prev => [...prev, { role: 'assistant', content: `图片 "${image.name}" 分析错误: ${error instanceof Error ? error.message : String(error)}` }])
        setProgress(Math.round(((i + 1) / images.length) * 100))
      }
    }
    setIsLoading(false)
    setProgress(100)
    setMessage('')
  }

  const exportChat = (format: 'txt' | 'md') => {
    let content = ''
    let fileExtension = ''
    if (format === 'txt') {
      content = chatHistory.map(chat => {
        const role = chat.role === 'user' ? '用户' : '智能助手';
        const formattedContent = chat.role === 'assistant' 
          ? chat.content.replace(/\n+/g, ' ').trim() 
          : chat.content.trim();
        return `${role}：${formattedContent}\n\n`;
      }).join('')
      fileExtension = 'txt'
    } else if (format === 'md') {
      content = chatHistory.map(chat => {
        const role = chat.role === 'user' ? '用户' : '智能助手';
        const formattedContent = chat.role === 'assistant' 
          ? chat.content.replace(/\n+/g, ' ').trim() 
          : chat.content.trim();
        return `**${role}**：${formattedContent}\n\n`;
      }).join('')
      fileExtension = 'md'
    }
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `聊天记录导出.${fileExtension}`
    a.click()
  }

  const handleEditPrompt = (index: number) => {
    setEditingPromptIndex(index)
    setEditingPromptValue(prompts[index])
  }

  const handleSavePrompt = () => {
    if (editingPromptIndex !== null) {
      const newPrompts = [...prompts];
      newPrompts[editingPromptIndex] = editingPromptValue;
      setPrompts(newPrompts);
      localStorage.setItem('savedPrompts', JSON.stringify(newPrompts));
      setEditingPromptIndex(null);
      setEditingPromptValue('');
    }
  }

  const handleCancelEdit = () => {
    setEditingPromptIndex(null)
    setEditingPromptValue('')
  }

  const handleSaveSettings = () => {
    localStorage.setItem('encryptedApiKey', encryptApiKey(apiKey))
    localStorage.setItem('baseUrl', baseUrl)
    alert('设置已保存')
  }

  const handleClearChat = () => {
    if (window.confirm('确定要清空所有对话吗？此操作不可撤销。')) {
      setChatHistory([]);
    }
  }

  // 定义一个用的卡片背景样式
  const cardBackgroundStyle = "bg-white/60 backdrop-blur-lg shadow-lg rounded-3xl overflow-hidden border-none flex flex-col";

  return (
    <div className="relative h-screen flex flex-col bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
      
      <div className="relative z-10 flex flex-col flex-grow px-8 py-4 max-w-7xl mx-auto w-full overflow-hidden">
        <header className="flex flex-col items-center mb-4 relative">
          <h1 className="text-4xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
            图说心语
          </h1>
          <p className="text-xl mt-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            与图片对话，倾听图像背后的故事
          </p>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <Link
              href="https://github.com/luoshui-coder/PixelAnalyser"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/50 backdrop-blur-md hover:bg-white/60 transition-all duration-300 p-2"
            >
              <Github className="h-5 w-5 text-gray-700" />
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/50 backdrop-blur-md hover:bg-white/60 transition-all duration-300">
                  <SettingsIcon className="h-5 w-5 text-gray-700" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-100 rounded-lg border-none shadow-lg max-w-sm w-full p-4">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-800 mb-4">设置</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="apiKey" className="text-sm font-medium text-gray-700">
                      API Key
                    </label>
                    <Input
                      id="apiKey"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full rounded-md border-gray-300 bg-white focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="baseUrl" className="text-sm font-medium text-gray-700">
                      Base URL
                    </label>
                    <Input
                      id="baseUrl"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      className="w-full rounded-md border-gray-300 bg-white focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSaveSettings}
                  className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300"
                >
                  保存设置
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        
        <div className="flex gap-6 flex-grow overflow-hidden h-[calc(100vh-160px)]">
          {/* 图片上传卡片 */}
          <Card className={`w-1/4 ${cardBackgroundStyle}`}>
            <CardContent className="p-4 flex flex-col h-full">
              <h2 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                图片上传
              </h2>
              <Button onClick={() => fileInputRef.current?.click()} className="mb-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all duration-300">
                <PlusIcon className="mr-2 h-4 w-4" /> 上传图片
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                multiple
                accept="image/*"
              />
              <ScrollArea className="flex-grow">
                <div className="grid grid-cols-2 gap-2">
                  {images.map((image) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group"
                    >
                      <Image
                        src={image.url}
                        alt={image.name}
                        width={150}
                        height={150}
                        layout="responsive"
                        className="rounded-2xl"
                      />
                      <Button
                        onClick={() => handleDeleteImage(image.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        size="icon"
                        variant="destructive"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* 对话卡片 */}
          <Card className={`w-1/2 ${cardBackgroundStyle}`}>
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-yellow-500">
                  对话
                </h2>
                <div className="flex items-center space-x-2">
                  {isLoading && (
                    <div className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700">处理中... {progress}%</span>
                      </div>
                    </div>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                        <DownloadIcon className="h-5 w-5 text-gray-700" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 bg-white/80 backdrop-blur-md rounded-xl shadow-lg">
                      <div className="flex flex-col space-y-2">
                        <Button onClick={() => exportChat('txt')} variant="ghost" className="justify-start rounded-lg">
                          导出为 TXT
                        </Button>
                        <Button onClick={() => exportChat('md')} variant="ghost" className="justify-start rounded-lg">
                          导出为 Markdown
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    onClick={handleClearChat}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                  >
                    <TrashIcon className="h-5 w-5 text-gray-700" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-grow mb-4 h-[calc(100vh-280px)]">
                <div ref={chatContainerRef} className="space-y-2 pr-4">
                  <AnimatePresence>
                    {chatHistory.map((chat, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-sm max-w-[80%] ${
                            chat.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                          } break-words shadow-md`}
                        >
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({node, ...props}) => <p className="mb-2" {...props} />,
                              a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                              code: ({node, inline, ...props}) => (
                                inline 
                                  ? <code className="bg-gray-100 rounded px-1" {...props} />
                                  : <code className="block bg-gray-100 rounded p-2 my-2" {...props} />
                              ),
                            }}
                          >
                            {chat.content}
                          </ReactMarkdown>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
              <div className="relative mt-auto">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit(e);
                    }
                  }}
                  placeholder="输入您的消息..."
                  className="w-full pr-12 rounded-2xl border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  rows={2}
                />
                <Button 
                  onClick={handleChatSubmit} 
                  disabled={isLoading}
                  className="absolute bottom-2 right-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all duration-300"
                  size="icon"
                >
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 预设提示词卡片 */}
          <Card className={`w-1/4 ${cardBackgroundStyle}`}>
            <CardContent className="p-4 flex flex-col h-full">
              <h2 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                预设提示词
              </h2>
              <div className="flex-grow flex flex-col space-y-2 overflow-hidden">
                {prompts.map((prompt, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-white/50 rounded-xl shadow-sm"
                  >
                    {editingPromptIndex === index ? (
                      <div className="flex w-full items-center p-1">
                        <Input
                          value={editingPromptValue}
                          onChange={(e) => setEditingPromptValue(e.target.value)}
                          onBlur={handleSavePrompt}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePrompt();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-grow text-sm py-1 px-2 rounded-xl"
                          autoFocus
                        />
                        <Button
                          onClick={handleSavePrompt}
                          size="sm"
                          variant="ghost"
                          className="ml-2"
                        >
                          保存
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={() => handlePromptClick(prompt)}
                          variant="ghost"
                          className="flex-grow justify-start text-left h-auto py-2 px-4 text-sm overflow-hidden rounded-xl hover:bg-blue-100 transition-colors"
                        >
                          <span className="truncate">{prompt}</span>
                        </Button>
                        <Button
                          onClick={() => handleEditPrompt(index)}
                          size="icon"
                          variant="ghost"
                          className="flex-shrink-0 h-10 w-10 rounded-full"
                        >
                          <EditIcon className="h-5 w-5 text-gray-700" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* footer 部分 */}
      <footer className="relative z-10 w-full flex items-center justify-center" style={{ height: '40px' }}>
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-xs text-gray-600">
            © Copyright 2024. luoshui.life All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}