import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../store/features/budgetSlice';
import toast from 'react-hot-toast';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const CategoryManager = ({ onClose, onUpdate }) => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.budget);
  const [newCategory, setNewCategory] = useState({ name: '', limit: '', color: COLORS[0] });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleAdd = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsAdding(true);
    try {
      await dispatch(createCategory({
        categoryName: newCategory.name,
        monthlyLimit: parseFloat(newCategory.limit) || 0,
        color: newCategory.color
      })).unwrap();
      setNewCategory({ name: '', limit: '', color: COLORS[0] });
      onUpdate();
      toast.success('Category added!');
    } catch (error) {
      toast.error(error || 'Failed to add category');
    }
    setIsAdding(false);
  };

  const handleUpdate = async (id) => {
    try {
      await dispatch(updateCategory({
        id,
        data: {
          categoryName: editData.name,
          monthlyLimit: parseFloat(editData.limit) || 0,
          color: editData.color
        }
      })).unwrap();
      setEditingId(null);
      onUpdate();
      toast.success('Category updated!');
    } catch (error) {
      toast.error(error || 'Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    
    try {
      await dispatch(deleteCategory(id)).unwrap();
      onUpdate();
      toast.success('Category deleted!');
    } catch (error) {
      toast.error(error || 'Failed to delete category');
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditData({
      name: category.category_name,
      limit: category.monthly_limit,
      color: category.color || COLORS[0]
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Manage Categories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Add New Category */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-700">Add New Category</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Category name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                value={newCategory.limit}
                onChange={(e) => setNewCategory({ ...newCategory, limit: e.target.value })}
                placeholder="Limit"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCategory({ ...newCategory, color })}
                    className={`w-6 h-6 rounded-full ${newCategory.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Add
              </button>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No categories yet</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                >
                  {editingId === category.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        value={editData.limit}
                        onChange={(e) => setEditData({ ...editData, limit: e.target.value })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <div className="flex space-x-1">
                        {COLORS.slice(0, 5).map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditData({ ...editData, color })}
                            className={`w-5 h-5 rounded-full ${editData.color === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => handleUpdate(category.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color || '#3B82F6' }}
                        />
                        <span className="font-medium text-gray-900">{category.category_name}</span>
                        <span className="text-sm text-gray-500">
                          ${parseFloat(category.monthly_limit).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEdit(category)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;