'use client'

import { useState } from 'react'
import { 
  Card, 
  Switch, 
  Input, 
  Label, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Button,
  Textarea
} from '@website-chat/ui'
import { GripVertical, Bold, Italic, Underline, Strikethrough, Link, List, ListOrdered, AlignLeft, Code } from 'lucide-react'

interface FormField {
  id: string
  key: string
  type: 'text' | 'email' | 'phone' | 'textarea'
  required: boolean
  label: string
  placeholder: string
  enabled: boolean
}

export default function PreChatFormSettings() {
  const [enablePreChatForm, setEnablePreChatForm] = useState(true)
  const [preChatMessage, setPreChatMessage] = useState('Share your queries or comments here.')
  const [formFields, setFormFields] = useState<FormField[]>([
    {
      id: '1',
      key: 'emailAddress',
      type: 'email',
      required: true,
      label: 'Email Id',
      placeholder: 'emailAddress',
      enabled: true
    },
    {
      id: '2',
      key: 'fullName',
      type: 'text',
      required: false,
      label: 'Full name',
      placeholder: 'fullName',
      enabled: false
    }
  ])

  const handleFieldToggle = (fieldId: string, newValue: boolean) => {
    console.log('handleFieldToggle called with fieldId:', fieldId, 'newValue:', newValue)
    setFormFields(fields => {
      console.log('Current fields:', fields)
      const updatedFields = fields.map(field =>
        field.id === fieldId ? { ...field, enabled: newValue } : field
      )
      console.log('Updated fields:', updatedFields)
      return updatedFields
    })
  }

  const handleFieldChange = (fieldId: string, field: keyof FormField, value: any) => {
    setFormFields(fields =>
      fields.map(f =>
        f.id === fieldId ? { ...f, [field]: value } : f
      )
    )
  }

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving pre-chat form settings:', {
      enablePreChatForm,
      preChatMessage,
      formFields
    })
  }

  return (
    <div className="space-y-6 relative overflow-visible">
      {/* Description */}
      <p className="text-gray-600">
        Pre chat forms enable you to capture user information before they start conversation with you.
      </p>

      {/* Enable Pre Chat Form */}
      <div className="space-y-3 relative">
        <Label htmlFor="enable-form">Enable pre chat form</Label>
        <Select value={enablePreChatForm ? 'yes' : 'no'} onValueChange={(value) => setEnablePreChatForm(value === 'yes')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pre Chat Message */}
      <div className="space-y-3">
        <Label htmlFor="pre-chat-message">Pre chat message</Label>
        <div className="border rounded-md">
          {/* Toolbar */}
          <div className="border-b p-2 flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Underline className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Strikethrough className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Code className="h-4 w-4" />
            </Button>
          </div>
          {/* Textarea */}
          <Textarea
            value={preChatMessage}
            onChange={(e) => setPreChatMessage(e.target.value)}
            className="border-0 resize-none min-h-[100px]"
            placeholder="Share your queries or comments here."
          />
        </div>
      </div>

      {/* Pre Chat Form Fields */}
      <div className="space-y-3">
        <Label>Pre chat form fields</Label>
        <Card className="p-0">
          <div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    {/* Toggle column */}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KEY
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TYPE
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    REQUIRED
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LABEL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PLACEHOLDER
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formFields.map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                    <Switch
                        id={`field-toggle-${field.id}`}
                        checked={field.enabled}
                        onCheckedChange={(newChecked) => {
                          console.log('Switch clicked for field:', field.id, 'current enabled:', field.enabled)
                          handleFieldToggle(field.id, newChecked)
                        }}
                    />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={field.key}
                        onChange={(e) => handleFieldChange(field.id, 'key', e.target.value)}
                        className="w-32"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select 
                        value={field.type} 
                        onValueChange={(value) => handleFieldChange(field.id, 'type', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="text">text</SelectItem>
                          <SelectItem value="email">email</SelectItem>
                          <SelectItem value="phone">phone</SelectItem>
                          <SelectItem value="textarea">textarea</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={field.label}
                        onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                        className="w-32"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={field.placeholder}
                        onChange={(e) => handleFieldChange(field.id, 'placeholder', e.target.value)}
                        className="w-32"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          Update Pre Chat Form Settings
        </Button>
      </div>
      <div className="space-y-3 relative">
        <Label htmlFor="enable-form">Enable pre chat form</Label>
        <Select value={enablePreChatForm ? 'yes' : 'no'} onValueChange={(value) => setEnablePreChatForm(value === 'yes')}>
          <SelectTrigger className="w-1/2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
} 