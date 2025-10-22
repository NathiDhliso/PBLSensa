/**
 * UI Showcase Page
 * 
 * A page to demonstrate all UI components and their states
 * Useful for testing and development
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, Trash2, Edit, Check, X } from 'lucide-react';
import { Button, Input, Select, TagInput, Modal } from '@/components/ui';
import { CreateCourseModal } from '@/components/courses';
import { pageTransition } from '@/utils/animations';

export function UIShowcasePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [tags, setTags] = useState<string[]>(['React', 'TypeScript']);
  const [selectedOption, setSelectedOption] = useState('');

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen p-4 pt-20 bg-gray-50 dark:bg-dark-bg-primary"
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-deep-amethyst dark:text-dark-accent-amethyst mb-8">
          UI Component Showcase
        </h1>

        {/* Buttons Section */}
        <section className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary mb-6">
            Buttons
          </h2>
          
          <div className="space-y-6">
            {/* Primary Buttons */}
            <div>
              <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-3">
                Primary Buttons
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="md">
                  Medium
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
                <Button variant="primary" size="md" leftIcon={<Plus size={20} />}>
                  With Icon
                </Button>
                <Button variant="primary" size="md" isLoading>
                  Loading
                </Button>
                <Button variant="primary" size="md" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Secondary Buttons */}
            <div>
              <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-3">
                Secondary Buttons
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="secondary" size="md">
                  Secondary
                </Button>
                <Button variant="secondary" size="md" leftIcon={<Upload size={20} />}>
                  Upload
                </Button>
                <Button variant="secondary" size="md" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Outline Buttons */}
            <div>
              <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-3">
                Outline Buttons
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" size="md">
                  Outline
                </Button>
                <Button variant="outline" size="md" leftIcon={<Edit size={20} />}>
                  Edit
                </Button>
                <Button variant="outline" size="md" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Ghost Buttons */}
            <div>
              <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-3">
                Ghost Buttons
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="ghost" size="md">
                  Ghost
                </Button>
                <Button variant="ghost" size="md" leftIcon={<X size={20} />}>
                  Cancel
                </Button>
              </div>
            </div>

            {/* Danger Actions (using outline with red styling) */}
            <div>
              <h3 className="text-lg font-semibold text-text-dark dark:text-dark-text-primary mb-3">
                Danger Actions
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" size="md" className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20">
                  Danger
                </Button>
                <Button variant="outline" size="md" leftIcon={<Trash2 size={20} />} className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20">
                  Delete
                </Button>
                <Button variant="outline" size="md" disabled className="text-red-600 border-red-600">
                  Disabled
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Form Inputs Section */}
        <section className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary mb-6">
            Form Inputs
          </h2>
          
          <div className="space-y-6 max-w-md">
            <Input
              label="Text Input"
              placeholder="Enter text..."
              type="text"
            />
            
            <Input
              label="Email Input"
              placeholder="email@example.com"
              type="email"
              required
            />
            
            <Input
              label="Password Input"
              placeholder="Enter password"
              type="password"
            />
            
            <Input
              label="Input with Error"
              placeholder="This has an error"
              error="This field is required"
            />
            
            <Input
              label="Disabled Input"
              placeholder="Disabled"
              disabled
            />

            <Select
              label="Select Dropdown"
              options={selectOptions}
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              placeholder="Choose an option"
            />

            <TagInput
              label="Tag Input"
              value={tags}
              onChange={setTags}
              placeholder="Add tags..."
            />
          </div>
        </section>

        {/* Modals Section */}
        <section className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary mb-6">
            Modals & Portals
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsModalOpen(true)}
            >
              Open Basic Modal
            </Button>
            
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsCreateCourseOpen(true)}
              leftIcon={<Plus size={20} />}
            >
              Open Create Course Modal
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> All modals now use React Portals and render outside the main DOM hierarchy.
              This prevents z-index issues and ensures proper stacking context.
            </p>
          </div>
        </section>

        {/* Color Palette Section */}
        <section className="bg-white dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-dark dark:text-dark-text-primary mb-6">
            Color Palette
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 bg-deep-amethyst rounded-lg"></div>
              <p className="text-sm text-text-dark dark:text-dark-text-primary">Deep Amethyst</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-warm-coral rounded-lg"></div>
              <p className="text-sm text-text-dark dark:text-dark-text-primary">Warm Coral</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-soft-sage rounded-lg"></div>
              <p className="text-sm text-text-dark dark:text-dark-text-primary">Soft Sage</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-gentle-sky rounded-lg"></div>
              <p className="text-sm text-text-dark dark:text-dark-text-primary">Gentle Sky</p>
            </div>
          </div>
        </section>

        {/* Basic Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Basic Modal Example"
          size="md"
        >
          <div className="p-6">
            <p className="text-text-medium dark:text-dark-text-secondary mb-4">
              This is a basic modal using the new Modal component with Portal rendering.
            </p>
            <p className="text-text-medium dark:text-dark-text-secondary mb-6">
              Features:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-medium dark:text-dark-text-secondary mb-6">
              <li>Portal rendering (renders outside main DOM)</li>
              <li>Backdrop click to close</li>
              <li>Escape key to close</li>
              <li>Smooth animations</li>
              <li>Prevents body scroll when open</li>
              <li>Accessible with ARIA attributes</li>
            </ul>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(false)}
                leftIcon={<Check size={20} />}
              >
                Got it!
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Course Modal */}
        <CreateCourseModal
          isOpen={isCreateCourseOpen}
          onClose={() => setIsCreateCourseOpen(false)}
          onSubmit={async (data) => {
            console.log('Course data:', data);
            setIsCreateCourseOpen(false);
          }}
        />
      </div>
    </motion.div>
  );
}
