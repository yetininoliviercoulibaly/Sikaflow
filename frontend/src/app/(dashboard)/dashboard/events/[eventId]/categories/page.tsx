'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CategoryService, TicketCategory, CreateCategoryDto, UpdateCategoryDto } from '@/features/categories/services/category.service';
import styles from './CategoriesPage.module.css';

export default function CategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TicketCategory | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: '',
    price: 0,
    capacity: 100,
    isDefault: false,
    benefits: [],
  });
  const [benefitInput, setBenefitInput] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CategoryService.listCategories(eventId);
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const updateDto: UpdateCategoryDto = {
          name: formData.name,
          price: formData.price,
          capacity: formData.capacity,
          benefits: formData.benefits,
        };
        await CategoryService.updateCategory(eventId, editingCategory.id, updateDto);
      } else {
        await CategoryService.createCategory(eventId, formData);
      }
      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await CategoryService.deleteCategory(eventId, categoryId);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleSetDefault = async (categoryId: string) => {
    try {
      await CategoryService.setDefaultCategory(eventId, categoryId);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const openEditModal = (cat: TicketCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      price: cat.price,
      capacity: cat.capacity,
      isDefault: cat.isDefault,
      benefits: cat.benefits,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', price: 0, capacity: 100, isDefault: false, benefits: [] });
    setBenefitInput('');
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData(prev => ({ ...prev, benefits: [...(prev.benefits || []), benefitInput.trim()] }));
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({ ...prev, benefits: prev.benefits?.filter((_, i) => i !== index) }));
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>← Retour</button>
        <h1>Catégories de Billets</h1>
        <button onClick={() => { resetForm(); setEditingCategory(null); setShowModal(true); }} className={styles.addBtn}>
          + Nouvelle catégorie
        </button>
      </header>

      <div className={styles.grid}>
        {categories.map(cat => (
          <div key={cat.id} className={`${styles.card} ${cat.isDefault ? styles.defaultCard : ''}`}>
            <div className={styles.cardHeader}>
              <h2>{cat.name}</h2>
              {cat.isDefault && <span className={styles.defaultBadge}>Défaut</span>}
            </div>
            
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{cat.price} €</span>
                <span className={styles.statLabel}>Prix</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{cat.soldCount}/{cat.capacity}</span>
                <span className={styles.statLabel}>Vendus</span>
              </div>
            </div>

            {cat.benefits && cat.benefits.length > 0 && (
              <div className={styles.benefits}>
                <strong>Avantages :</strong>
                <ul>
                  {cat.benefits.map((b, i) => <li key={i}>✓ {b}</li>)}
                </ul>
              </div>
            )}

            <div className={styles.actions}>
              <button onClick={() => openEditModal(cat)} className={styles.editBtn}>Modifier</button>
              {!cat.isDefault && (
                <button onClick={() => handleSetDefault(cat.id)} className={styles.defaultBtn}>
                  Définir par défaut
                </button>
              )}
              <button 
                onClick={() => handleDelete(cat.id)} 
                className={styles.deleteBtn}
                disabled={cat.soldCount > 0}
                title={cat.soldCount > 0 ? 'Billets déjà vendus' : 'Supprimer'}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nom</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: VIP, Standard, Early Bird"
                  required 
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Prix (€)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.price} 
                    onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Capacité</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.capacity} 
                    onChange={e => setFormData(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                    required 
                  />
                </div>
              </div>

              {!editingCategory && (
                <div className={styles.formGroup}>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={formData.isDefault}
                      onChange={e => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                    />
                    {' '}Catégorie par défaut
                  </label>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Avantages</label>
                <div className={styles.benefitInput}>
                  <input 
                    type="text"
                    value={benefitInput}
                    onChange={e => setBenefitInput(e.target.value)}
                    placeholder="Ex: Accès backstage"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  />
                  <button type="button" onClick={addBenefit}>+</button>
                </div>
                <ul className={styles.benefitList}>
                  {formData.benefits?.map((b, i) => (
                    <li key={i}>{b} <button type="button" onClick={() => removeBenefit(i)}>×</button></li>
                  ))}
                </ul>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                  Annuler
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingCategory ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
