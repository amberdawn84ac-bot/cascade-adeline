"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Scissors, BookOpen, Plus, Upload, Loader2, Camera, CheckCircle } from 'lucide-react';

interface GeneratedProject {
  id: string;
  title: string;
  type: 'recipe' | 'pattern';
  materials: string[];
  instructions: string[];
  tips: string[];
  createdAt: Date;
}

interface SavedProject extends GeneratedProject {
  id: string;
  photo?: string;
  creditsAwarded?: number;
  completedAt?: Date;
}

export default function DomesticArtsDashboardPage() {
  const [activeTab, setActiveTab] = useState('kitchen');
  
  // Generation state
  const [projectType, setProjectType] = useState<'recipe' | 'pattern'>('recipe');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [interestInput, setInterestInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null);
  
  // Journal state
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoadingJournal, setIsLoadingJournal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleGenerate = async () => {
    if (!interestInput.trim()) return;
    
    setIsGenerating(true);
    setGeneratedProject(null);
    
    try {
      const response = await fetch('/api/domestic-arts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: projectType, 
          skillLevel, 
          interest: interestInput 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate project');
      
      const data = await response.json();
      setGeneratedProject(data.project);
    } catch (error) {
      console.error('Error generating project:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProject = async () => {
    if (!generatedProject) return;
    
    try {
      const response = await fetch('/api/domestic-arts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedProject),
      });
      
      if (!response.ok) throw new Error('Failed to save project');
      
      // Refresh journal
      await loadJournal();
      setGeneratedProject(null);
      setInterestInput('');
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handlePhotoUpload = async (projectId: string, file: File) => {
    setUploadingPhoto(true);
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('projectId', projectId);
      
      const response = await fetch('/api/domestic-arts/upload-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload photo');
      
      // Refresh journal to show updated credits
      await loadJournal();
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const loadJournal = async () => {
    setIsLoadingJournal(true);
    try {
      const response = await fetch('/api/domestic-arts/journal');
      if (!response.ok) throw new Error('Failed to load journal');
      
      const data = await response.json();
      setSavedProjects(data.projects);
    } catch (error) {
      console.error('Error loading journal:', error);
    } finally {
      setIsLoadingJournal(false);
    }
  };

  // Load journal on component mount
  useEffect(() => {
    loadJournal();
  }, []);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <ChefHat className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold">Domestic Arts</h1>
          <p className="text-gray-600">Master kitchen skills, sewing projects, and creative journaling</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="kitchen" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Kitchen
          </TabsTrigger>
          <TabsTrigger value="sewing" className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            Sewing
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Journal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kitchen" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Generator</CardTitle>
              <CardDescription>
                Generate custom recipes based on your skill level and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Select value={skillLevel} onValueChange={(value: any) => setSkillLevel(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={projectType} onValueChange={(value: any) => setProjectType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recipe">Recipe</SelectItem>
                    <SelectItem value="pattern">Pattern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Textarea
                placeholder="Tell me what you'd like to make, dietary preferences, available ingredients, or cooking goals..."
                value={interestInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInterestInput(e.target.value)}
                rows={3}
              />
              
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !interestInput.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Recipe...
                  </>
                ) : (
                  'Generate Recipe'
                )}
              </Button>

              {generatedProject && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">{generatedProject.title}</h3>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          {generatedProject.type}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Materials Needed:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {generatedProject.materials.map((material, index) => (
                            <li key={index} className="text-sm">{material}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Instructions:</h4>
                        <ol className="list-decimal list-inside space-y-2">
                          {generatedProject.instructions.map((instruction, index) => (
                            <li key={index} className="text-sm">{instruction}</li>
                          ))}
                        </ol>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Tips & Tricks:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {generatedProject.tips.map((tip, index) => (
                            <li key={index} className="text-sm text-gray-600">{tip}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button onClick={handleSaveProject} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Save to Journal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sewing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Generator</CardTitle>
              <CardDescription>
                Create sewing patterns and projects tailored to your skill level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Select value={skillLevel} onValueChange={(value: any) => setSkillLevel(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={projectType} onValueChange={(value: any) => setProjectType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recipe">Recipe</SelectItem>
                    <SelectItem value="pattern">Pattern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Textarea
                placeholder="Describe what you'd like to sew, fabric preferences, occasion, or skill goals..."
                value={interestInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInterestInput(e.target.value)}
                rows={3}
              />
              
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !interestInput.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Pattern...
                  </>
                ) : (
                  'Generate Pattern'
                )}
              </Button>

              {generatedProject && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">{generatedProject.title}</h3>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          {generatedProject.type}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Materials Needed:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {generatedProject.materials.map((material, index) => (
                            <li key={index} className="text-sm">{material}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Instructions:</h4>
                        <ol className="list-decimal list-inside space-y-2">
                          {generatedProject.instructions.map((instruction, index) => (
                            <li key={index} className="text-sm">{instruction}</li>
                          ))}
                        </ol>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Tips & Tricks:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {generatedProject.tips.map((tip, index) => (
                            <li key={index} className="text-sm text-gray-600">{tip}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button onClick={handleSaveProject} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Save to Journal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Journal</CardTitle>
              <CardDescription>
                Your saved domestic arts projects and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingJournal ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : savedProjects.length > 0 ? (
                <div className="space-y-4">
                  {savedProjects.map((project) => (
                    <Card key={project.id} className="relative">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{project.title}</h3>
                              <p className="text-sm text-gray-600">
                                Created: {new Date(project.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {project.creditsAwarded && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  {project.creditsAwarded.toFixed(2)} credits
                                </Badge>
                              )}
                              <Badge variant="outline">{project.type}</Badge>
                            </div>
                          </div>
                          
                          {project.photo && (
                            <div className="mt-3">
                              <img 
                                src={project.photo} 
                                alt={project.title}
                                className="w-32 h-32 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(project.id, file);
                              }}
                              className="hidden"
                              id={`photo-upload-${project.id}`}
                            />
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              disabled={uploadingPhoto}
                            >
                              <label htmlFor={`photo-upload-${project.id}`} className="cursor-pointer">
                                {uploadingPhoto ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Add Photo
                                  </>
                                )}
                              </label>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No projects yet</p>
                  <p className="text-sm">Generate and save your first domestic arts project to see it here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
