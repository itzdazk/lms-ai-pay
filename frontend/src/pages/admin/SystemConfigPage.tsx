// frontend/src/pages/admin/SystemConfigPage.tsx
import { Settings, Save, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useSystemConfig } from '../../hooks/useSystemConfig'
import {
    SystemInfoSection,
    LandingPageSection,
    AboutPageSection,
    FooterSection,
    SEOSection,
    LegalSection,
} from '../../components/admin/system-config'

export function SystemConfigPage() {
    const {
        formData,
        loading,
        saving,
        handleSave,
        updateNestedField,
        updateArrayField,
        addArrayItem,
        removeArrayItem,
    } = useSystemConfig()

    if (loading) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
            </div>
        )
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-2xl font-bold text-foreground flex items-center gap-2'>
                        <Settings className='h-6 w-6' />
                        Cài đặt chung
                    </h1>
                    <p className='text-sm text-muted-foreground mt-1'>
                        Quản lý các cài đặt chung của hệ thống
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className='bg-blue-600 hover:bg-blue-700'
                >
                    {saving ? (
                        <>
                            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Save className='h-4 w-4 mr-2' />
                            Lưu thay đổi
                        </>
                    )}
                </Button>
            </div>

            <Tabs defaultValue='system' className='w-full'>
                <TabsList className='grid w-full grid-cols-6 mb-6 !bg-[#1A1A1A] !border-[#2D2D2D]'>
                    <TabsTrigger 
                        value='system'
                        className='!text-gray-400 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white'
                    >
                        Hệ thống
                    </TabsTrigger>
                    <TabsTrigger 
                        value='landing'
                        className='!text-gray-400 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white'
                    >
                        Trang chủ
                    </TabsTrigger>
                    <TabsTrigger 
                        value='about'
                        className='!text-gray-400 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white'
                    >
                        Giới thiệu
                    </TabsTrigger>
                    <TabsTrigger 
                        value='footer'
                        className='!text-gray-400 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white'
                    >
                        Footer
                    </TabsTrigger>
                    <TabsTrigger 
                        value='seo'
                        className='!text-gray-400 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white'
                    >
                        SEO
                    </TabsTrigger>
                    <TabsTrigger 
                        value='legal'
                        className='!text-gray-400 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white'
                    >
                        Pháp lý
                    </TabsTrigger>
                </TabsList>

                {/* System Tab */}
                <TabsContent value='system'>
                    <SystemInfoSection
                        formData={formData}
                        onUpdate={updateNestedField}
                    />
                </TabsContent>

                {/* Landing Page Tab */}
                <TabsContent value='landing'>
                    <LandingPageSection
                        formData={formData}
                        onUpdate={updateNestedField}
                    />
                </TabsContent>

                {/* About Page Tab */}
                <TabsContent value='about'>
                    <AboutPageSection
                        formData={formData}
                        onUpdate={updateNestedField}
                        onUpdateArray={updateArrayField}
                        onAddArrayItem={addArrayItem}
                        onRemoveArrayItem={removeArrayItem}
                    />
                </TabsContent>

                {/* Footer Tab */}
                <TabsContent value='footer'>
                    <FooterSection
                        formData={formData}
                        onUpdate={updateNestedField}
                        onUpdateArray={updateArrayField}
                        onAddArrayItem={addArrayItem}
                        onRemoveArrayItem={removeArrayItem}
                    />
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value='seo'>
                    <SEOSection formData={formData} onUpdate={updateNestedField} />
                </TabsContent>

                {/* Legal Tab */}
                <TabsContent value='legal'>
                    <LegalSection formData={formData} onUpdate={updateNestedField} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
