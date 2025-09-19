/**
 * AdminModalDemo Component
 * Demo component showcasing all admin modal and overlay components
 * This can be used for testing and documentation purposes
 */

'use client'

import React from 'react'
import { 
  AdminModal, 
  AdminDialog, 
  AdminDrawer, 
  AdminTooltip,
  AdminPopover,
  HelpTooltip,
  InfoTooltip,
  MenuPopover
} from './index'
import { Settings, User, FileText, Trash2, Edit, Info } from 'lucide-react'

export const AdminModalDemo: React.FC = () => {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Admin Modal Components Demo
        </h1>
        <p className="text-slate-600">
          Healthcare-compliant modal, dialog, drawer, tooltip, and popover components
        </p>
      </div>

      {/* Modal Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Modal Examples
          <HelpTooltip 
            content="Modals are used for displaying content that requires user interaction or attention" 
            className="ml-2"
          />
        </h2>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Open Standard Modal
          </button>
        </div>

        <AdminModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Patient Information Form"
          description="Update patient details with HIPAA-compliant handling"
          size="lg"
          showCloseButton
          footer={
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          }
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient Name
                <InfoTooltip content="Full legal name as it appears on insurance documents" />
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter patient name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Medical Record Number
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MRN-000000"
              />
            </div>
          </form>
        </AdminModal>
      </section>

      {/* Dialog Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Dialog Examples
        </h2>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setDialogOpen(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Patient Record
          </button>
        </div>

        <AdminDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Delete Patient Record"
          description="This action cannot be undone. The patient record and all associated data will be permanently deleted."
          severity="error"
          destructive
          onConfirm={async () => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            console.log('Patient record deleted')
          }}
          confirmText="Delete Record"
          cancelText="Keep Record"
        />
      </section>

      {/* Drawer Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Drawer Examples
        </h2>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Open Patient Details
          </button>
        </div>

        <AdminDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Patient Medical History"
          description="Comprehensive medical record overview"
          position="right"
          size="lg"
          collapsible
          footer={
            <div className="text-xs text-slate-500">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          }
        >
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700">DOB:</span>
                  <span className="ml-2 text-slate-600">01/15/1985</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Gender:</span>
                  <span className="ml-2 text-slate-600">Female</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Recent Visits</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((visit) => (
                  <div key={visit} className="p-3 bg-slate-50 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-900">Annual Checkup</p>
                        <p className="text-sm text-slate-600">Dr. Smith - Cardiology</p>
                      </div>
                      <span className="text-xs text-slate-500">2 days ago</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </AdminDrawer>
      </section>

      {/* Tooltip Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Tooltip Examples</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <span className="text-slate-700">Medical Abbreviations</span>
            <AdminTooltip
              content={
                <div className="space-y-2">
                  <p><strong>BP:</strong> Blood Pressure</p>
                  <p><strong>HR:</strong> Heart Rate</p>
                  <p><strong>O2 Sat:</strong> Oxygen Saturation</p>
                </div>
              }
              title="Common Abbreviations"
              variant="help"
              hipaaCompliant
            />
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-700">Critical Alert</span>
            <AdminTooltip
              content="Patient requires immediate attention - abnormal lab results detected"
              variant="error"
              severity="critical"
              actions={[
                { label: 'Review', onClick: () => console.log('Review clicked') },
                { label: 'Acknowledge', onClick: () => console.log('Acknowledged') }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Popover Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Popover Examples</h2>
        
        <div className="flex items-center space-x-4">
          <MenuPopover
            actions={[
              {
                label: 'Edit Patient',
                onClick: () => console.log('Edit clicked'),
                icon: <Edit className="w-4 h-4" />
              },
              {
                label: 'View History',
                onClick: () => console.log('History clicked'),
                icon: <FileText className="w-4 h-4" />
              },
              { separator: true, label: '', onClick: () => {} },
              {
                label: 'Delete Patient',
                onClick: () => console.log('Delete clicked'),
                icon: <Trash2 className="w-4 h-4" />,
                variant: 'danger'
              }
            ]}
            title="Patient Actions"
          />

          <AdminPopover
            variant="info"
            title="Lab Results Summary"
            content={
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cholesterol:</span>
                  <span className="font-medium text-green-600">Normal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Blood Sugar:</span>
                  <span className="font-medium text-amber-600">Elevated</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Blood Pressure:</span>
                  <span className="font-medium text-red-600">High</span>
                </div>
              </div>
            }
            actions={[
              {
                label: 'Full Report',
                onClick: () => console.log('Full report'),
                variant: 'primary'
              }
            ]}
            trigger={
              <button className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200">
                <Info className="w-4 h-4 mr-2" />
                Lab Results
              </button>
            }
            hipaaCompliant
          />
        </div>
      </section>
    </div>
  )
}

export default AdminModalDemo