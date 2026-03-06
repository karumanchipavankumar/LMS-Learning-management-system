import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './AddCourse.css';

const AddCourse = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        duration: '',
        contents: '',
        thumbnail: null,
        video: null
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const categories = ['Development', 'Business', 'Design', 'Marketing', 'IT & Software'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            alert('Only JPG or PNG allowed');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Thumbnail must be ≤ 2MB');
            return;
        }

        setFormData(prev => ({ ...prev, thumbnail: file }));
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            alert('Only video files allowed');
            return;
        }

        setFormData(prev => ({ ...prev, video: file }));
        if (errors.video) setErrors(prev => ({ ...prev, video: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Course title is required';
        else if (formData.title.length < 3 || formData.title.length > 100) newErrors.title = 'Title must be 3-100 characters';

        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        else if (formData.description.length > 500) newErrors.description = 'Max 500 characters';

        if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
        else if (!/^[1-9][0-9]*.*$/.test(formData.duration)) newErrors.duration = 'Must start with a positive number (non-zero)';

        if (!formData.contents.trim()) newErrors.contents = 'Course contents are required';
        else if (formData.contents.length < 10) newErrors.contents = 'Minimum 10 characters required';

        if (!formData.thumbnail) newErrors.thumbnail = 'Thumbnail is required';
        if (!formData.video) newErrors.video = 'Course video is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            const token = localStorage.getItem('token'); // ADMIN JWT

            const multipartData = new FormData();

            multipartData.append(
                'course',
                new Blob([JSON.stringify({
                    title: formData.title,
                    category: formData.category,
                    description: formData.description,
                    duration: formData.duration,
                    contents: formData.contents
                })], { type: 'application/json' })
            );

            multipartData.append('thumbnail', formData.thumbnail);
            multipartData.append('video', formData.video);

            const response = await fetch('http://localhost:8080/admin/courses', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: multipartData
            });

            if (!response.ok) {
                throw new Error('Course creation failed');
            }

            alert('Course created successfully');
            navigate('/admin');

        } catch (error) {
            console.error(error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                alert('Failed to create course');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            title: '',
            category: '',
            description: '',
            duration: '',
            thumbnail: null,
            video: null
        });
        setPreviewUrl(null);
        setErrors({});
    };

    return (
        <div className="add-course-page-wrapper">
            <div className="user-management-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0' }}>

                <div className="add-course-header">
                    <ArrowLeft
                        className="back-arrow-icon"
                        onClick={() => navigate('/admin', { state: { activeTab: 'Course Management' } })}
                    />
                    <div className="add-course-title">Add New Course</div>
                </div>

                <div className="add-course-form">

                    {/* Media */}
                    <div className="form-section">
                        <div className="section-title">Course Media</div>

                        {/* Thumbnail */}
                        <div className="thumbnail-upload-section">
                            <label className={`thumbnail-preview ${errors.thumbnail ? 'validation-error' : ''}`}>
                                {previewUrl ? <img src={previewUrl} alt="Preview" /> : <span>Upload Thumbnail</span>}
                                <input type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} hidden />
                            </label>
                            {errors.thumbnail && <div className="error-text">{errors.thumbnail}</div>}
                        </div>

                        {/* Video */}
                        <div style={{ marginTop: '16px' }}>
                            <label className="add-course-label">
                                Course Video <span className="required-mark">*</span>
                            </label>
                            <input type="file" accept="video/*" onChange={handleVideoUpload} />
                            {errors.video && <div className="error-text">{errors.video}</div>}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="form-section">
                        <div className="section-title">Course Information</div>

                        <div className="form-row">
                            <div className="form-col">
                                <label className="add-course-label">Course Title</label>
                                <input className={`add-course-input ${errors.title ? 'error' : ''}`} name="title" placeholder="Title" value={formData.title} onChange={handleChange} />
                                {errors.title && <div className="error-text">{errors.title}</div>}
                            </div>
                            <div className="form-col">
                                <label className="add-course-label">Category</label>
                                <select className={`add-course-select ${errors.category ? 'error' : ''}`} name="category" value={formData.category} onChange={handleChange}>
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c}>{c}</option>)}
                                </select>
                                {errors.category && <div className="error-text">{errors.category}</div>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-col">
                                <label className="add-course-label">Duration</label>
                                <input className={`add-course-input ${errors.duration ? 'error' : ''}`} name="duration" placeholder="Duration (e.g., 5h 30m)" value={formData.duration} onChange={handleChange} />
                                {errors.duration && <div className="error-text">{errors.duration}</div>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-col">
                                <label className="add-course-label">Description</label>
                                <textarea className={`add-course-textarea ${errors.description ? 'error' : ''}`} name="description" value={formData.description} onChange={handleChange} />
                                {errors.description && <div className="error-text">{errors.description}</div>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-col">
                                <label className="add-course-label">
                                    Course Contents <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6B7280', marginLeft: '8px' }}>(Include timestamps anywhere: MM:SS or HH:MM:SS)</span>
                                </label>
                                <textarea
                                    className={`add-course-textarea ${errors.contents ? 'error' : ''}`}
                                    name="contents"
                                    placeholder="00:00 Introduction&#10;Getting Started - 02:30&#10;Deep Dive 12:35 into Topic"
                                    value={formData.contents}
                                    onChange={handleChange}
                                    style={{ height: '120px' }}
                                />
                                {errors.contents && <div className="error-text">{errors.contents}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="form-footer">
                        <button className="btn btn-outline" onClick={() => navigate('/admin')}>Cancel</button>
                        <button className="btn btn-danger" onClick={handleReset}>Reset</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Save & Create'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AddCourse;
