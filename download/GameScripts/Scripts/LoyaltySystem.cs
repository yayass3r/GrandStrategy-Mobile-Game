// =============================================================================
// LoyaltySystem.cs
// نظام الولاء والسمات الكامل
// يتحكم في: مؤشر الولاء، تأثيراته، الأحداث المرتبطة به، نظام السمات
// =============================================================================

using System;
using System.Collections.Generic;
using UnityEngine;

namespace GrandStrategyGame.LoyaltySystem
{
    // ==================== أسباب تغير الولاء ====================

    /// <summary>
    /// أسباب تغير الولاء - تُستخدم لتتبع لماذا تغير الولاء
    /// </summary>
    public enum LoyaltyChangeReason
    {
        HighTaxes,           // ضرائب مرتفعة
        LowTaxes,            // ضرائب منخفضة
        ArmyConscripted,     // سحب الجيش من المدينة
        ArmyReinforced,      // تعزيز الجيش في المدينة
        GovernorAssigned,    // تعيين قائد جديد
        GovernorDismissed,   // عزل القائد
        CityConquered,       // احتلال المدينة
        Starvation,          // مجاعة
        FestivalHeld,        // إقامة مهرجان
        BuildingBuilt,       // بناء مباني
        NaturalDisaster,     // كارثة طبيعية
        TraitEffect,         // تأثير سمة القائد
        VictoryInBattle,     // نصر في معركة
        DefeatInBattle,      // هزيمة في معركة
        TradeRoute,          // طريق تجاري
        BorderThreat,        // تهديد حدودي
        NaturalDecay,        // انخفاض طبيعي
        PlayerDecision,      // قرار اللاعب
        CulturalEvent,       // حدث ثقافي
        ReligiousBonus,      // مكافأة دينية
        Corruption,          // فساد
        None                 // بدون سبب
    }

    /// <summary>
    /// مستوى خطر التمرد
    /// </summary>
    public enum RebellionRiskLevel
    {
        /// <summary>لا خطر</summary>
        None,
        
        /// <summary>خطر منخفض - تذمر خفيف</summary>
        Low,
        
        /// <summary>خطر متوسط - احتمال تمرد</summary>
        Medium,
        
        /// <summary>خطر عالي - تمرد وشيك</summary>
        High,
        
        /// <summary>تمرد فعلي</summary>
        Rebellion
    }

    // ==================== سجل تغيرات الولاء ====================

    /// <summary>
    /// سجل تغير واحد في الولاء
    /// </summary>
    [Serializable]
    public struct LoyaltyChangeRecord
    {
        public int turnNumber;
        public float changeAmount;
        public float loyaltyBefore;
        public float loyaltyAfter;
        public LoyaltyChangeReason reason;
        public string description;

        public override string ToString()
        {
            return $"Turn {turnNumber}: {changeAmount:+0.0;-0.0} ({reason}) " +
                   $"[{loyaltyBefore:F0}% -> {loyaltyAfter:F0}%] {description}";
        }
    }

    // ==================== نظام الولاء الرئيسي ====================

    /// <summary>
    /// LoyaltyManager: يتحكم في نظام الولاء الكامل للمدينة.
    /// 
    /// آليات الولاء:
    /// - الولاء يتأثر بالضرائب، قرارات اللاعب، سمات القادة، الأحداث
    /// - انخفاض الولاء يزيد خطر التمرد
    /// - ارتفاع الولاء يزيد الإنتاجية ويقلل تكاليف الصيانة
    /// 
    /// الاستخدام:
    /// - يتصل به نظام المدينة ونظام القادة
    /// - يُحدّث كل دورة لعب
    /// </summary>
    public class LoyaltyManager
    {
        // ==================== إعدادات ====================

        [Serializable]
        public struct LoyaltySettings
        {
            [Tooltip("معدل الانخفاض الطبيعي للولاء (لكل دورة)")]
            public float naturalDecayRate;
            
            [Tooltip("عتبة خطر التمرد المنخفض")]
            public float lowRebellionThreshold;
            
            [Tooltip("عتبة خطر التمرد المتوسط")]
            public float mediumRebellionThreshold;
            
            [Tooltip("عتبة خطر التمرد العالي")]
            public float highRebellionThreshold;
            
            [Tooltip="عتبة حدوث التمرد")]
            public float rebellionThreshold;
            
            [Tooltip("احتمال التمرد لكل دورة عند العتبة (0-1)")]
            public float rebellionChancePerTurn;
            
            [Tooltip("حد أقصى للولاء")]
            public float maxLoyalty;
            
            [Tooltip("حد أدنى للولاء")]
            public float minLoyalty;

            public static LoyaltySettings Default => new LoyaltySettings
            {
                naturalDecayRate = 0.3f,
                lowRebellionThreshold = 45f,
                mediumRebellionThreshold = 30f,
                highRebellionThreshold = 15f,
                rebellionThreshold = 10f,
                rebellionChancePerTurn = 0.15f,
                maxLoyalty = 100f,
                minLoyalty = 0f
            };
        }

        // ==================== بيانات ====================

        private readonly string _cityName;
        private float _currentLoyalty;
        private float _loyaltyTrend; // اتجاه الولاء (إيجابي/سلبي)
        private readonly LoyaltySettings _settings;
        private readonly List<LoyaltyChangeRecord> _changeHistory;

        // ==================== أحداث ====================

        /// <summary>
        /// يُطلق عند تغير الولاء
        /// </summary>
        public event Action<float, float, LoyaltyChangeReason> OnLoyaltyChanged;
        
        /// <summary>
        /// يُطلق عند تغير مستوى خطر التمرد
        /// </summary>
        public event Action<RebellionRiskLevel, RebellionRiskLevel> OnRebellionRiskChanged;
        
        /// <summary>
        /// يُطلق عند حدوث تمرد
        /// </summary>
        public event Action OnRebellionStarted;
        
        /// <summary>
        /// يُطلق عندما يصل الولاء لمستوى حرج
        /// </summary>
        public event Action<RebellionRiskLevel> OnLoyaltyCritical;

        // ==================== الخصائص ====================

        public float CurrentLoyalty => _currentLoyalty;
        public float LoyaltyTrend => _loyaltyTrend;
        public RebellionRiskLevel CurrentRisk => CalculateRebellionRisk();
        public IReadOnlyList<LoyaltyChangeRecord> ChangeHistory => _changeHistory.AsReadOnly();

        // ==================== البناء ====================

        public LoyaltyManager(string cityName, float initialLoyalty = 70f)
        {
            _cityName = cityName;
            _currentLoyalty = initialLoyalty;
            _settings = LoyaltySettings.Default;
            _changeHistory = new List<LoyaltyChangeRecord>();
            _loyaltyTrend = 0f;
        }

        // ==================== تعديل الولاء ====================

        /// <summary>
        /// تعديل الولاء مع تسجيل السبب
        /// </summary>
        public void ModifyLoyalty(float amount, LoyaltyChangeReason reason, string description = "")
        {
            float oldLoyalty = _currentLoyalty;
            float oldRisk = (float)CalculateRebellionRisk();

            // تطبيق التعديل
            _currentLoyalty += amount;
            _currentLoyalty = Mathf.Clamp(_currentLoyalty, _settings.minLoyalty, _settings.maxLoyalty);

            // تحديث الاتجاه
            _loyaltyTrend = amount > 0 ? Mathf.Min(1f, _loyaltyTrend + 0.1f) 
                                     : amount < 0 ? Mathf.Max(-1f, _loyaltyTrend - 0.1f) 
                                     : _loyaltyTrend * 0.95f;

            // تسجيل التغيير
            var record = new LoyaltyChangeRecord
            {
                turnNumber = GameManager.Instance?.CurrentTurn ?? 0,
                changeAmount = amount,
                loyaltyBefore = oldLoyalty,
                loyaltyAfter = _currentLoyalty,
                reason = reason,
                description = description
            };
            _changeHistory.Add(record);

            // الحد الأقصى للسجل (أخر 100 تغيير)
            if (_changeHistory.Count > 100)
            {
                _changeHistory.RemoveAt(0);
            }

            // إطلاق الأحداث
            if (Mathf.Abs(oldLoyalty - _currentLoyalty) > 0.01f)
            {
                OnLoyaltyChanged?.Invoke(oldLoyalty, _currentLoyalty, reason);
            }

            float newRisk = (float)CalculateRebellionRisk();
            if (Math.Abs(oldRisk - newRisk) > 0.01f)
            {
                OnRebellionRiskChanged?.Invoke(
                    (RebellionRiskLevel)oldRisk,
                    (RebellionRiskLevel)newRisk
                );
            }

            // تحقق من المستوى الحرج
            CheckCriticalLevels();
        }

        /// <summary>
        /// تعديل مبسط بدون سبب محدد
        /// </summary>
        public void ModifyLoyalty(float amount)
        {
            ModifyLoyalty(amount, LoyaltyChangeReason.None, "");
        }

        // ==================== التحديث الدوري ====================

        /// <summary>
        /// تحديث الولاء كل دورة - الانخفاض الطبيعي + التحقق من التمرد
        /// </summary>
        public void OnTurnUpdate()
        {
            // 1. الانخفاض الطبيعي
            if (_currentLoyalty > 50f)
            {
                ModifyLoyalty(-_settings.naturalDecayRate, 
                    LoyaltyChangeReason.NaturalDecay, 
                    "Natural loyalty decay");
            }

            // 2. تقليل الاتجاه تدريجياً
            _loyaltyTrend *= 0.9f;

            // 3. التحقق من خطر التمرد
            CheckRebellion();
        }

        // ==================== نظام التمرد ====================

        /// <summary>
        /// حساب مستوى خطر التمرد الحالي
        /// </summary>
        public RebellionRiskLevel CalculateRebellionRisk()
        {
            if (_currentLoyalty > _settings.lowRebellionThreshold)
                return RebellionRiskLevel.None;
            if (_currentLoyalty > _settings.mediumRebellionThreshold)
                return RebellionRiskLevel.Low;
            if (_currentLoyalty > _settings.highRebellionThreshold)
                return RebellionRiskLevel.Medium;
            if (_currentLoyalty > _settings.rebellionThreshold)
                return RebellionRiskLevel.High;
            return RebellionRiskLevel.Rebellion;
        }

        /// <summary>
        /// التحقق مما إذا كان التمرد سيحدث هذه الدورة
        /// </summary>
        private void CheckRebellion()
        {
            RebellionRiskLevel risk = CalculateRebellionRisk();

            if (risk == RebellionRiskLevel.Rebellion)
            {
                // احتمال التمرد يزيد كلما انخفض الولاء
                float rebellionChance = _settings.rebellionChancePerTurn;
                
                // مضاعف بناءً على مدى انخفاض الولاء
                float crisisMultiplier = 1f + (_settings.rebellionThreshold - _currentLoyalty) / 10f;
                rebellionChance *= crisisMultiplier;

                // سلبية الاتجاه تزيد الاحتمال
                if (_loyaltyTrend < -0.5f)
                    rebellionChance *= 1.5f;

                if (UnityEngine.Random.Range(0f, 1f) < rebellionChance)
                {
                    TriggerRebellion();
                }
            }
        }

        /// <summary>
        /// تحريك التمرد
        /// </summary>
        private void TriggerRebellion()
        {
            OnRebellionStarted?.Invoke();
            Debug.LogWarning($"[{_cityName}] REBELLION! Loyalty dropped to {_currentLoyalty:F0}%");
        }

        /// <summary>
        /// التحقق من المستويات الحرجة
        /// </summary>
        private void CheckCriticalLevels()
        {
            RebellionRiskLevel risk = CalculateRebellionRisk();
            
            if (risk >= RebellionRiskLevel.Medium)
            {
                OnLoyaltyCritical?.Invoke(risk);
            }
        }

        // ==================== تأثيرات الولاء ====================

        /// <summary>
        /// حساب مضاعف الإنتاجية بناءً على الولاء
        /// ولاء عالي = إنتاجية أعلى
        /// </summary>
        public float GetProductivityModifier()
        {
            if (_currentLoyalty >= 80f) return 1.2f;
            if (_currentLoyalty >= 60f) return 1.1f;
            if (_currentLoyalty >= 40f) return 1.0f;
            if (_currentLoyalty >= 25f) return 0.85f;
            return 0.7f;
        }

        /// <summary>
        /// حساب مضاعف تكلفة الصيانة بناءً على الولاء
        /// ولاء منخفض = تكاليف أعلى
        /// </summary>
        public float GetMaintenanceCostModifier()
        {
            if (_currentLoyalty >= 70f) return 0.9f;
            if (_currentLoyalty >= 50f) return 1.0f;
            if (_currentLoyalty >= 30f) return 1.2f;
            return 1.5f;
        }

        /// <summary>
        /// حساب احتمال فقدان وحدة عسكرية بسبب التمرد
        /// </summary>
        public float GetDesertionChance()
        {
            if (_currentLoyalty >= 50f) return 0f;
            if (_currentLoyalty >= 30f) return 0.02f;
            if (_currentLoyalty >= 15f) return 0.05f;
            return 0.10f;
        }

        // ==================== دوال المعلومات ====================

        /// <summary>
        /// الحصول على ملخص حالة الولاء
        /// </summary>
        public string GetLoyaltyReport()
        {
            RebellionRiskLevel risk = CalculateRebellionRisk();
            string riskText = risk switch
            {
                RebellionRiskLevel.None => "✅ Stable",
                RebellionRiskLevel.Low => "⚠️ Minor unrest",
                RebellionRiskLevel.Medium => "⚠️ Significant unrest",
                RebellionRiskLevel.High => "🔴 High rebellion risk!",
                RebellionRiskLevel.Rebellion => "🔴 ACTIVE REBELLION!",
                _ => "Unknown"
            };

            string trendText = _loyaltyTrend > 0.2f ? "📈 Rising" :
                               _loyaltyTrend < -0.2f ? "📉 Falling" : "➡️ Stable";

            return $"Loyalty: {_currentLoyalty:F0}% | Risk: {riskText} | Trend: {trendText}";
        }
    }

    // ==================== مدير الأحداث المرتبطة بالولاء ====================

    /// <summary>
    /// LoyaltyEventEffects: يحتوي على جميع التأثيرات الممكنة على الولاء
    /// لأحداث اللعبة المختلفة
    /// </summary>
    public static class LoyaltyEventEffects
    {
        /// <summary>
        /// الحصول على تغير الولاء لحدث معين
        /// </summary>
        public static float GetLoyaltyEffect(string eventId)
        {
            return eventId switch
            {
                // أحداث إيجابية
                "festival_held" => 5f,
                "market_built" => 3f,
                "temple_built" => 5f,
                "victory_celebration" => 8f,
                "trade_route_established" => 4f,
                "tax_reduction" => 10f,
                "food_surplus" => 3f,
                "governor_popular" => 5f,
                
                // أحداث سلبية
                "high_taxes" => -8f,
                "army_conscripted" => -5f,
                "food_shortage" => -10f,
                "plague" => -15f,
                "natural_disaster" => -12f,
                "governor_corrupt" => -8f,
                "defeat_in_battle" => -10f,
                "city_occupied" => -20f,
                "neighboring_rebellion" => -3f,
                
                // أحداث محايدة
                "new_governor" => -2f, // انخفاض طفيف مع قائد جديد
                "border_skirmish" => -2f,
                
                _ => 0f
            };
        }

        /// <summary>
        /// الحصول على سبب الولاء لحدث معين
        /// </summary>
        public static LoyaltyChangeReason GetReasonForEvent(string eventId)
        {
            return eventId switch
            {
                "high_taxes" => LoyaltyChangeReason.HighTaxes,
                "tax_reduction" => LoyaltyChangeReason.LowTaxes,
                "army_conscripted" => LoyaltyChangeReason.ArmyConscripted,
                "army_reinforced" => LoyaltyChangeReason.ArmyReinforced,
                "new_governor" => LoyaltyChangeReason.GovernorAssigned,
                "governor_removed" => LoyaltyChangeReason.GovernorDismissed,
                "city_occupied" => LoyaltyChangeReason.CityConquered,
                "food_shortage" => LoyaltyChangeReason.Starvation,
                "festival_held" => LoyaltyChangeReason.FestivalHeld,
                "market_built" => LoyaltyChangeReason.BuildingBuilt,
                "temple_built" => LoyaltyChangeReason.BuildingBuilt,
                "earthquake" => LoyaltyChangeReason.NaturalDisaster,
                "victory_celebration" => LoyaltyChangeReason.VictoryInBattle,
                "defeat_in_battle" => LoyaltyChangeReason.DefeatInBattle,
                "trade_route_established" => LoyaltyChangeReason.TradeRoute,
                "governor_corrupt" => LoyaltyChangeReason.Corruption,
                _ => LoyaltyChangeReason.None
            };
        }
    }

    // ==================== GameManager Placeholder ====================

    /// <summary>
    /// مدير اللعبة العام - يُستخدم لتتبع رقم الدورة الحالية
    /// </summary>
    public class GameManager
    {
        private static GameManager _instance;
        public static GameManager Instance => _instance ??= new GameManager();

        public int CurrentTurn { get; private set; } = 1;

        public void AdvanceTurn()
        {
            CurrentTurn++;
        }
    }
}
