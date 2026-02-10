import { motion } from "framer-motion";
import { useState } from "react";

const chatMessages = [
  { role: "user" as const, text: "How much did I spend on food this month?" },
  {
    role: "ai" as const,
    text: "You've spent ₹8,240 on food this month — that's 12% more than last month. Your top spots: Swiggy (₹3,100), Zomato (₹2,800), and grocery stores (₹2,340).",
  },
  { role: "user" as const, text: "Can you suggest a budget?" },
  {
    role: "ai" as const,
    text: "Based on your income and spending patterns, I'd recommend:\n\n• Food: ₹7,000/mo\n• Transport: ₹3,000/mo\n• Entertainment: ₹2,500/mo\n• Savings: ₹15,000/mo\n\nThis would help you save 30% more each month.",
  },
];

const AIDemoSection = () => {
  const [visibleMessages, setVisibleMessages] = useState(chatMessages);

  return (
    <section id="assistant" className="section-padding overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex justify-center"
          >
            <div className="relative w-[280px] md:w-[320px]">
              {/* Phone frame */}
              <div className="bg-foreground rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-background rounded-[2.4rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="h-12 flex items-center justify-center">
                    <div className="w-20 h-5 bg-foreground rounded-full" />
                  </div>

                  {/* Chat header */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-display font-bold text-sm">
                      FinTrack AI
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your financial assistant
                    </p>
                  </div>

                  {/* Chat messages */}
                  <div className="h-[380px] overflow-y-auto p-4 space-y-3">
                    {visibleMessages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2 }}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            msg.role === "user"
                              ? "bg-foreground text-background rounded-br-md"
                              : "bg-secondary text-foreground rounded-bl-md"
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing indicator */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                          className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
                        />
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            delay: 0.2,
                          }}
                          className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
                        />
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            delay: 0.4,
                          }}
                          className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-border">
                    <div className="bg-secondary rounded-full px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Ask anything...
                      </span>
                      <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center">
                        <span className="text-background text-xs">↑</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4 font-medium">
              AI Assistant
            </p>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Ask Anything.
              <br />
              <span className="text-muted-foreground">Get Answers.</span>
            </h2>
            <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-md">
              Your personal finance AI understands your spending patterns,
              suggests budgets, detects anomalies, and helps you make better
              financial decisions — all through natural conversation.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "How much did I spend on food?",
                "Suggest a budget for me",
                "How can I save more?",
              ].map((q, i) => (
                <motion.div
                  key={q}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="inline-block mr-2"
                >
                  <span className="text-xs border border-border px-3 py-1.5 rounded-full text-muted-foreground">
                    "{q}"
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AIDemoSection;
