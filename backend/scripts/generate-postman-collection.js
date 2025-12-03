#!/usr/bin/env node
/**
 * Script to generate complete Postman Collection from routes
 * This script reads route files and generates a comprehensive Postman collection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read existing collection
const collectionPath = path.join(__dirname, '../postman/LMS-AI-PAY-NEW.postman_collection.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Additional endpoints to add
const additionalEndpoints = {
    "Instructor Courses": [
        {
            name: "Get Instructor Courses",
            method: "GET",
            url: "{{base_url}}/instructor/courses?page=1&limit=20",
            auth: "instructor_token"
        },
        {
            name: "Get Course Statistics",
            method: "GET",
            url: "{{base_url}}/instructor/courses/statistics",
            auth: "instructor_token"
        },
        {
            name: "Create Course",
            method: "POST",
            url: "{{base_url}}/instructor/courses",
            auth: "instructor_token",
            body: {
                title: "New Course Title",
                description: "Course description",
                shortDescription: "Short description",
                price: 499000,
                categoryId: 1,
                level: "BEGINNER",
                durationHours: 10,
                language: "vi"
            }
        },
        {
            name: "Update Course",
            method: "PUT",
            url: "{{base_url}}/instructor/courses/{{course_id}}",
            auth: "instructor_token",
            body: {
                title: "Updated Course Title",
                description: "Updated description"
            }
        },
        {
            name: "Delete Course",
            method: "DELETE",
            url: "{{base_url}}/instructor/courses/{{course_id}}",
            auth: "instructor_token"
        },
        {
            name: "Get Course Analytics",
            method: "GET",
            url: "{{base_url}}/instructor/courses/{{course_id}}/analytics",
            auth: "instructor_token"
        },
        {
            name: "Change Course Status",
            method: "PATCH",
            url: "{{base_url}}/instructor/courses/{{course_id}}/status",
            auth: "instructor_token",
            body: {
                status: "PUBLISHED"
            }
        },
        {
            name: "Add Tags to Course",
            method: "POST",
            url: "{{base_url}}/instructor/courses/{{course_id}}/tags",
            auth: "instructor_token",
            body: {
                tagIds: [1, 2, 3]
            }
        }
    ],
    "Instructor Lessons": [
        {
            name: "Create Lesson",
            method: "POST",
            url: "{{base_url}}/instructor/courses/{{course_id}}/lessons",
            auth: "instructor_token",
            body: {
                title: "New Lesson",
                description: "Lesson description",
                order: 1,
                duration: 30
            }
        },
        {
            name: "Update Lesson",
            method: "PUT",
            url: "{{base_url}}/instructor/courses/{{course_id}}/lessons/{{lesson_id}}",
            auth: "instructor_token",
            body: {
                title: "Updated Lesson",
                description: "Updated description"
            }
        },
        {
            name: "Delete Lesson",
            method: "DELETE",
            url: "{{base_url}}/instructor/courses/{{course_id}}/lessons/{{lesson_id}}",
            auth: "instructor_token"
        },
        {
            name: "Publish Lesson",
            method: "PATCH",
            url: "{{base_url}}/instructor/courses/{{course_id}}/lessons/{{lesson_id}}/publish",
            auth: "instructor_token",
            body: {
                isPublished: true
            }
        },
        {
            name: "Reorder Lesson",
            method: "PATCH",
            url: "{{base_url}}/instructor/courses/{{course_id}}/lessons/{{lesson_id}}/order",
            auth: "instructor_token",
            body: {
                newOrder: 2
            }
        }
    ],
    "Instructor Quizzes": [
        {
            name: "Create Lesson Quiz",
            method: "POST",
            url: "{{base_url}}/instructor/lessons/{{lesson_id}}/quizzes",
            auth: "instructor_token",
            body: {
                title: "Quiz Title",
                description: "Quiz description",
                timeLimit: 30,
                passingScore: 70
            }
        },
        {
            name: "Create Course Quiz",
            method: "POST",
            url: "{{base_url}}/instructor/courses/{{course_id}}/quizzes",
            auth: "instructor_token",
            body: {
                title: "Course Quiz",
                description: "Quiz description",
                timeLimit: 60,
                passingScore: 70
            }
        },
        {
            name: "Update Quiz",
            method: "PUT",
            url: "{{base_url}}/instructor/quizzes/{{quiz_id}}",
            auth: "instructor_token",
            body: {
                title: "Updated Quiz",
                timeLimit: 45
            }
        },
        {
            name: "Delete Quiz",
            method: "DELETE",
            url: "{{base_url}}/instructor/quizzes/{{quiz_id}}",
            auth: "instructor_token"
        },
        {
            name: "Publish Quiz",
            method: "PATCH",
            url: "{{base_url}}/instructor/quizzes/{{quiz_id}}/publish",
            auth: "instructor_token",
            body: {
                isPublished: true
            }
        },
        {
            name: "Get Quiz Submissions",
            method: "GET",
            url: "{{base_url}}/instructor/quizzes/{{quiz_id}}/submissions?page=1&limit=20",
            auth: "instructor_token"
        },
        {
            name: "Get Quiz Analytics",
            method: "GET",
            url: "{{base_url}}/instructor/quizzes/{{quiz_id}}/analytics",
            auth: "instructor_token"
        },
        {
            name: "Generate Quiz from Lesson (AI)",
            method: "POST",
            url: "{{base_url}}/instructor/quizzes/generate-from-lesson",
            auth: "instructor_token",
            body: {
                lessonId: "{{lesson_id}}",
                numQuestions: 10,
                difficulty: "MEDIUM"
            }
        },
        {
            name: "Generate Quiz from Course (AI)",
            method: "POST",
            url: "{{base_url}}/instructor/quizzes/generate-from-course",
            auth: "instructor_token",
            body: {
                courseId: "{{course_id}}",
                numQuestions: 20,
                difficulty: "MEDIUM"
            }
        }
    ],
    "Instructor Dashboard": [
        {
            name: "Get Instructor Stats",
            method: "GET",
            url: "{{base_url}}/dashboard/instructor/stats",
            auth: "instructor_token"
        },
        {
            name: "Get Instructor Revenue",
            method: "GET",
            url: "{{base_url}}/dashboard/instructor/revenue",
            auth: "instructor_token"
        },
        {
            name: "Get Instructor Analytics",
            method: "GET",
            url: "{{base_url}}/dashboard/instructor/analytics",
            auth: "instructor_token"
        },
        {
            name: "Get Instructor Students",
            method: "GET",
            url: "{{base_url}}/dashboard/instructor/students?page=1&limit=20",
            auth: "instructor_token"
        }
    ],
    "Admin Courses": [
        {
            name: "Get All Courses (Admin)",
            method: "GET",
            url: "{{base_url}}/admin/courses?page=1&limit=20",
            auth: "admin_token"
        },
        {
            name: "Get Platform Analytics",
            method: "GET",
            url: "{{base_url}}/admin/courses/analytics",
            auth: "admin_token"
        },
        {
            name: "Toggle Course Featured",
            method: "PATCH",
            url: "{{base_url}}/admin/courses/{{course_id}}/featured",
            auth: "admin_token",
            body: {
                isFeatured: true
            }
        }
    ],
    "Admin Orders": [
        {
            name: "Get Order Statistics",
            method: "GET",
            url: "{{base_url}}/admin/orders/stats",
            auth: "admin_token"
        },
        {
            name: "Get Revenue Trend",
            method: "GET",
            url: "{{base_url}}/admin/orders/revenue-trend",
            auth: "admin_token"
        },
        {
            name: "Get All Orders (Admin)",
            method: "GET",
            url: "{{base_url}}/admin/orders?page=1&limit=20",
            auth: "admin_token"
        }
    ],
    "Admin Quizzes": [
        {
            name: "Get All Quizzes (Admin)",
            method: "GET",
            url: "{{base_url}}/admin/quizzes?page=1&limit=20",
            auth: "admin_token"
        },
        {
            name: "Get Quiz Submissions (Admin)",
            method: "GET",
            url: "{{base_url}}/admin/quizzes/{{quiz_id}}/submissions?page=1&limit=20",
            auth: "admin_token"
        }
    ],
    "Admin Dashboard": [
        {
            name: "Get System Stats",
            method: "GET",
            url: "{{base_url}}/dashboard/admin/stats",
            auth: "admin_token"
        },
        {
            name: "Get Users Analytics",
            method: "GET",
            url: "{{base_url}}/dashboard/admin/users-analytics",
            auth: "admin_token"
        },
        {
            name: "Get Courses Analytics",
            method: "GET",
            url: "{{base_url}}/dashboard/admin/courses-analytics",
            auth: "admin_token"
        },
        {
            name: "Get Revenue Analytics",
            method: "GET",
            url: "{{base_url}}/dashboard/admin/revenue",
            auth: "admin_token"
        },
        {
            name: "Get Recent Activities",
            method: "GET",
            url: "{{base_url}}/dashboard/admin/activities",
            auth: "admin_token"
        }
    ],
    "Student Quizzes": [
        {
            name: "Get Quiz Submissions",
            method: "GET",
            url: "{{base_url}}/quizzes/{{quiz_id}}/submissions?page=1&limit=20",
            auth: "access_token"
        },
        {
            name: "Get Quiz Submission Details",
            method: "GET",
            url: "{{base_url}}/quizzes/{{quiz_id}}/submissions/{{submission_id}}",
            auth: "access_token"
        },
        {
            name: "Get Quiz Attempts",
            method: "GET",
            url: "{{base_url}}/quizzes/{{quiz_id}}/attempts",
            auth: "access_token"
        },
        {
            name: "Get Latest Quiz Result",
            method: "GET",
            url: "{{base_url}}/quizzes/{{quiz_id}}/result/latest",
            auth: "access_token"
        }
    ],
    "Transactions": [
        {
            name: "Get Transactions",
            method: "GET",
            url: "{{base_url}}/transactions?page=1&limit=20",
            auth: "access_token"
        },
        {
            name: "Get Transaction By ID",
            method: "GET",
            url: "{{base_url}}/transactions/{{transaction_id}}",
            auth: "access_token"
        }
    ],
    "Upload": [
        {
            name: "Upload Image",
            method: "POST",
            url: "{{base_url}}/uploads/image?type=avatar",
            auth: "access_token",
            isFileUpload: true
        },
        {
            name: "Upload Video",
            method: "POST",
            url: "{{base_url}}/uploads/video?type=lesson",
            auth: "instructor_token",
            isFileUpload: true
        },
        {
            name: "Upload Document",
            method: "POST",
            url: "{{base_url}}/uploads/document?type=transcript",
            auth: "instructor_token",
            isFileUpload: true
        },
        {
            name: "Get User Files",
            method: "GET",
            url: "{{base_url}}/uploads/user/files?page=1&limit=20",
            auth: "access_token"
        },
        {
            name: "Delete File",
            method: "DELETE",
            url: "{{base_url}}/uploads/{{file_id}}",
            auth: "instructor_token"
        }
    ],
    "AI Conversations": [
        {
            name: "Get Conversations",
            method: "GET",
            url: "{{base_url}}/ai/conversations?page=1&limit=20",
            auth: "access_token"
        },
        {
            name: "Create Conversation",
            method: "POST",
            url: "{{base_url}}/ai/conversations",
            auth: "access_token",
            body: {
                courseId: "{{course_id}}",
                title: "New Conversation"
            }
        },
        {
            name: "Get Conversation",
            method: "GET",
            url: "{{base_url}}/ai/conversations/{{conversation_id}}",
            auth: "access_token"
        },
        {
            name: "Delete Conversation",
            method: "DELETE",
            url: "{{base_url}}/ai/conversations/{{conversation_id}}",
            auth: "access_token"
        },
        {
            name: "Archive Conversation",
            method: "PATCH",
            url: "{{base_url}}/ai/conversations/{{conversation_id}}/archive",
            auth: "access_token"
        },
        {
            name: "Get Messages",
            method: "GET",
            url: "{{base_url}}/ai/conversations/{{conversation_id}}/messages?page=1&limit=20",
            auth: "access_token"
        },
        {
            name: "Send Message",
            method: "POST",
            url: "{{base_url}}/ai/conversations/{{conversation_id}}/messages",
            auth: "access_token",
            body: {
                message: "What is React?"
            }
        },
        {
            name: "Search Knowledge Base",
            method: "GET",
            url: "{{base_url}}/ai/search?q=react&courseId={{course_id}}",
            auth: "access_token"
        },
        {
            name: "Get Ollama Status",
            method: "GET",
            url: "{{base_url}}/ai/ollama/status",
            auth: "access_token"
        }
    ]
};

// Helper function to create request object
function createRequest(endpoint) {
    const urlParts = endpoint.url.replace('{{base_url}}', '').split('?');
    const pathParts = urlParts[0].split('/').filter(p => p);
    const queryString = urlParts[1] || '';
    
    const request = {
        method: endpoint.method,
        header: [
            {
                key: "Authorization",
                value: `Bearer {{${endpoint.auth}}}`
            }
        ],
        url: {
            raw: endpoint.url,
            host: ["{{base_url}}"],
            path: pathParts
        }
    };

    // Add query parameters
    if (queryString) {
        request.url.query = queryString.split('&').map(q => {
            const [key, value] = q.split('=');
            return { key, value: value || '' };
        });
    }

    // Add body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.body) {
        request.header.push({
            key: "Content-Type",
            value: "application/json"
        });
        request.body = {
            mode: "raw",
            raw: JSON.stringify(endpoint.body, null, 2)
        };
    }

    // Handle file uploads
    if (endpoint.isFileUpload) {
        request.body = {
            mode: "formdata",
            formdata: [
                {
                    key: endpoint.method === "POST" && endpoint.url.includes("/image") ? "image" : 
                         endpoint.url.includes("/video") ? "video" : "document",
                    type: "file",
                    src: []
                }
            ]
        };
    }

    return request;
}

// Add new folders to collection
Object.entries(additionalEndpoints).forEach(([folderName, endpoints]) => {
    const folder = {
        name: folderName,
        item: endpoints.map(endpoint => ({
            name: endpoint.name,
            request: createRequest(endpoint)
        }))
    };
    
    // Insert before "AI" folder (or at the end)
    const aiIndex = collection.item.findIndex(item => item.name === "AI");
    if (aiIndex !== -1) {
        collection.item.splice(aiIndex, 0, folder);
    } else {
        collection.item.push(folder);
    }
});

// Write updated collection
fs.writeFileSync(collectionPath, JSON.stringify(collection, null, '\t'));
console.log('✅ Postman Collection updated successfully!');
console.log(`📁 Added ${Object.keys(additionalEndpoints).length} new folders`);
console.log(`📝 Total endpoints: ${collection.item.reduce((sum, folder) => sum + (folder.item?.length || 0), 0)}`);


