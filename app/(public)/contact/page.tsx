'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  return (
    <>
      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              We'd love to hear from you. Send us a message!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <div className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="text-pink-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">support@ember.app</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="text-pink-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">+91 98765 43210</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-pink-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Location</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">Mumbai, India</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <Card>
              <div className="p-8">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFormData({ name: '', email: '', subject: '', message: '' });
                  }}
                >
                  <Input
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />

                  <Input
                    placeholder="Your Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />

                  <Input
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                  />

                  <textarea
                    placeholder="Your Message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-[1.75rem] border border-zinc-200/80 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-500/20 text-sm transition resize-none"
                  />

                  <Button className="w-full h-11 gap-2" type="submit">
                    <Send size={18} />
                    Send Message
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
