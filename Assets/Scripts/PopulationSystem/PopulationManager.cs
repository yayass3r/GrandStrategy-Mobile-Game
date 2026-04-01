// =============================================================================
// PopulationManager.cs
// المدير الرئيسي لنظام السكان
// يتحكم في: النمو السكاني، توزيع العمالة، التجنيد، السعادة
// =============================================================================

using System;
using System.Collections.Generic;
using UnityEngine;
using GrandStrategyGame.Events;

namespace GrandStrategyGame.PopulationSystem
{
    /// <summary>
    /// PopulationManager: المدير الرئيسي للسكان في كل مدينة.
    /// يتحكم في جميع جوانب السكان من النمو إلى التوزيع إلى التجنيد.
    /// 
    /// الاستخدام:
    /// 1. أضف هذا السكربت إلى GameObject المدينة.
    /// 2. المدير يتعامل تلقائياً مع نمو السكان وتوزيعهم كل دورة.
    /// 3. يمكن للقائد AI تعديل توزيع العمالة عبر دوال عامة.
    /// </summary>
    [Serializable]
    public class PopulationManager
    {
        // ==================== إعدادات عامة ====================
        [Header("=== Population Settings ===")]
        [SerializeField] private string _cityName = "New City";
        [SerializeField] private int _initialPopulation = 100;
        [SerializeField] private int _maxPopulation = 5000;
        [SerializeField] private int _militaryPopCap = 500; // الحد الأقصى للجنود

        // ==================== بيانات السكان ====================
        [Header("=== Current Population Data ===")]
        [SerializeField] private PopulationDemographics _demographics;
        [SerializeField] private LaborDistribution _laborDistribution;
        [SerializeField] private PopulationStatus _currentStatus = PopulationStatus.Normal;
        [SerializeField] private float _happiness = 50f; // 0-100
        [SerializeField] private float _loyalty = 70f;    // 0-100
        [SerializeField] private int _soldierCount = 0;
        [SerializeField] private float _growthProgress = 0f; // تقدم النمو الحالي

        // ==================== معدلات ====================
        [Header("=== Rates ===")]
        [SerializeField] private PopulationGrowthRates _growthRates;
        [SerializeField] private ProductionOutput _productionRates;

        // ==================== معدلات الاستهلاك ====================
        [Header("=== Consumption ===")]
        [Tooltip("استهلاك الغذاء لكل فرد (فارغ + عامل + مسن)")]
        [SerializeField] private float _foodConsumptionPerCapita = 1.0f;
        
        [Tooltip("حد السعادة الذي يُفعّل مكافأة النمو")]
        [SerializeField] private float _happinessThresholdForBonus = 60f;
        
        [Tooltip("حد السعادة الذي يُفعّل عقوبة النقص")]
        [SerializeField] private float _happinessThresholdForPenalty = 30f;

        // ==================== الأحداث (Events) ====================
        
        /// <summary>
        /// يُطلق عند تغير عدد السكان (زيادة أو نقصان)
        /// </summary>
        public event Action<int, int> OnPopulationChanged; // (oldCount, newCount)
        
        /// <summary>
        /// يُطلق عند تغير حالة السكان (مثلاً من عادي إلى سعيد)
        /// </summary>
        public event Action<PopulationStatus, PopulationStatus> OnStatusChanged; // (oldStatus, newStatus)
        
        /// <summary>
        /// يُطلق عند تجنيد جنود جدد
        /// </summary>
        public event Action<int> OnSoldiersRecruited; // count
        
        /// <summary>
        /// يُطلق عند فقدان جنود (موت في المعركة أو تسريح)
        /// </summary>
        public event Action<int> OnSoldiersLost; // count
        
        /// <summary>
        /// يُطلق عند تغير توزيع العمالة
        /// </summary>
        public event Action<LaborDistribution> OnLaborDistributionChanged;
        
        /// <summary>
        /// يُطلق عند تغير مستوى السعادة
        /// </summary>
        public event Action<float, float> OnHappinessChanged; // (oldValue, newValue)
        
        /// <summary>
        /// يُطلق عند وصول السكان للحد الأقصى
        /// </summary>
        public event Action OnMaxPopulationReached;

        // ==================== الخصائص (Properties) ====================
        
        public string CityName => _cityName;
        public int TotalPopulation => _demographics.TotalPopulation;
        public int Workforce => _demographics.adults - _soldierCount;
        public int AvailableWorkforce => Workforce - _laborDistribution.TotalWorkers + _laborDistribution.unemployed;
        public int SoldierCount => _soldierCount;
        public float Happiness => _happiness;
        public float Loyalty => _loyalty;
        public PopulationStatus Status => _currentStatus;
        public PopulationDemographics Demographics => _demographics;
        public LaborDistribution LaborDistribution => _laborDistribution;
        public int MaxPopulation => _maxPopulation;

        // ==================== البناء والتهيئة ====================

        /// <summary>
        /// إنشاء مدير سكان جديد مع بيانات أولية
        /// </summary>
        public PopulationManager(string cityName, int initialPopulation, int maxPop = 5000)
        {
            _cityName = cityName;
            _initialPopulation = initialPopulation;
            _maxPopulation = maxPop;
            _growthRates = PopulationGrowthRates.Default;
            _productionRates = ProductionOutput.Default;

            InitializePopulation(initialPopulation);
        }

        /// <summary>
        /// تهيئة السكان الأوليين
        /// </summary>
        private void InitializePopulation(int totalPop)
        {
            _demographics = PopulationDemographics.CreateInitial(totalPop);
            _laborDistribution = LaborDistribution.CreateEqual(_demographics.adults);
            _soldierCount = 0;
            _happiness = 50f;
            _loyalty = 70f;
            _growthProgress = 0f;
            _currentStatus = PopulationStatus.Normal;
        }

        // ==================== نظام النمو السكاني ====================

        /// <summary>
        /// تحديث النمو السكاني - يُنفَّذ كل دورة (Turn)
        /// يحسب النمو بناءً على: معدل الأساسي + مكافأة السعادة + وفرة الغذاء
        /// </summary>
        public void UpdatePopulationGrowth(float foodSurplus)
        {
            if (TotalPopulation >= _maxPopulation)
            {
                OnMaxPopulationReached?.Invoke();
                return;
            }

            // 1. حساب معدل النمو الفعلي
            float effectiveGrowthRate = CalculateEffectiveGrowthRate(foodSurplus);
            
            // 2. حساب عدد السكان الجدد
            int newPop = Mathf.RoundToInt(TotalPopulation * effectiveGrowthRate);
            
            if (newPop <= 0)
            {
                // في حالة النمو السلبي، لا نفقد سكان هذه الدورة
                // بل نجعل _growthProgress سلبياً
                _growthProgress += effectiveGrowthRate;
                
                // إذا تجاوز التقدم السلبي حداً معيناً، نفقد سكاناً فعلياً
                if (_growthProgress <= -1f)
                {
                    LosePopulation(1);
                    _growthProgress += 1f;
                }
                return;
            }

            // 3. التأكد من عدم تجاوز الحد الأقصى
            int newTotal = TotalPopulation + newPop;
            if (newTotal > _maxPopulation)
            {
                newPop = _maxPopulation - TotalPopulation;
            }

            // 4. توزيع السكان الجدد
            DistributeNewPopulation(newPop);
            
            _growthProgress = 0f;
        }

        /// <summary>
        /// حساب معدل النمو الفعلي بناءً على جميع العوامل
        /// </summary>
        private float CalculateEffectiveGrowthRate(float foodSurplus)
        {
            float rate = _growthRates.baseGrowthRate;

            // مكافأة السعادة
            if (_happiness >= _happinessThresholdForBonus)
            {
                float happinessMultiplier = (_happiness - _happinessThresholdForBonus) / 40f;
                rate += _growthRates.happinessBonus * happinessMultiplier;
            }

            // مكافأة / عقوبة الغذاء
            float foodPerCapita = TotalPopulation > 0 ? foodSurplus / TotalPopulation : 0f;
            
            if (foodPerCapita > 0.5f)
            {
                rate += _growthRates.foodSurplusBonus;
            }
            else if (foodPerCapita < 0f)
            {
                rate += _growthRates.foodDeficitPenalty * Mathf.Min(1f, Mathf.Abs(foodPerCapita));
            }

            // عقوبة الحالة
            switch (_currentStatus)
            {
                case PopulationStatus.Discontent:
                    rate -= 0.01f; break;
                case PopulationStatus.Angry:
                    rate -= 0.03f; break;
                case PopulationStatus.Desperate:
                    rate -= 0.05f; break;
            }

            // عقوبة نسبة الإعالة العالية
            float dependencyPressure = Mathf.Max(0, _demographics.DependencyRatio - 1.5f);
            rate -= dependencyPressure * 0.005f;

            // ضبط ضمن الحدود
            return Mathf.Clamp(rate, _growthRates.minGrowthRate, _growthRates.maxGrowthRate);
        }

        /// <summary>
        /// توزيع السكان الجدد على الفئات العمرية
        /// </summary>
        private void DistributeNewPopulation(int newPop)
        {
            int oldTotal = TotalPopulation;

            // 70% أطفال، 25% بالغون (شباب)، 5% مسنون
            int newChildren = Mathf.RoundToInt(newPop * 0.70f);
            int newAdults = Mathf.RoundToInt(newPop * 0.25f);
            int newElderly = newPop - newChildren - newAdults;

            var newDemo = new PopulationDemographics
            {
                children = _demographics.children + newChildren,
                adults = _demographics.adults + newAdults,
                elderly = _demographics.elderly + newElderly
            };

            _demographics = newDemo;

            // البالغون الجدد يصبحون عاطلين حتى يعينهم القائد
            _laborDistribution.unemployed += newAdults;

            OnPopulationChanged?.Invoke(oldTotal, TotalPopulation);
        }

        /// <summary>
        /// فقدان سكان (بسبب المجاعة، الحرب، الأمراض)
        /// </summary>
        private void LosePopulation(int amount)
        {
            if (amount <= 0 || TotalPopulation <= 0) return;

            int oldTotal = TotalPopulation;
            
            // فقدان بنسبة: 50% من العاطلين، 30% من البالغين العاملين، 20% أطفال ومسنين
            int fromUnemployed = Mathf.Min(_laborDistribution.unemployed, Mathf.RoundToInt(amount * 0.5f));
            int remaining = amount - fromUnemployed;
            int fromAdults = Mathf.Min(_demographics.adults - _soldierCount, Mathf.RoundToInt(remaining * 0.6f));
            remaining -= fromAdults;
            int fromChildren = Mathf.Min(_demographics.children, Mathf.RoundToInt(remaining * 0.7f));
            int fromElderly = Mathf.Min(_demographics.elderly, remaining - fromChildren);

            _laborDistribution.unemployed -= fromUnemployed;
            _demographics = new PopulationDemographics
            {
                children = _demographics.children - fromChildren,
                adults = _demographics.adults - fromAdults,
                elderly = _demographics.elderly - fromElderly
            };

            OnPopulationChanged?.Invoke(oldTotal, TotalPopulation);
        }

        // ==================== نظام توزيع العمالة ====================

        /// <summary>
        /// تعيين عمال لقطاع معين
        /// يتحقق من توفر عمال عاطلين قبل التعيين
        /// </summary>
        public bool AssignWorkers(LaborType type, int count)
        {
            if (count <= 0) return false;

            // التحقق من توفر عمال عاطلين
            if (count > _laborDistribution.unemployed)
            {
                Debug.LogWarning($"[{_cityName}] Not enough unemployed workers. " +
                    $"Requested: {count}, Available: {_laborDistribution.unemployed}");
                count = _laborDistribution.unemployed;
            }

            if (count <= 0) return false;

            // تعيين العمال
            int oldCount = _laborDistribution.GetWorkerCount(type);
            _laborDistribution.SetWorkerCount(type, oldCount + count);
            _laborDistribution.unemployed -= count;

            OnLaborDistributionChanged?.Invoke(_laborDistribution);
            return true;
        }

        /// <summary>
        /// نقل عمال من قطاع لآخر
        /// </summary>
        public bool TransferWorkers(LaborType fromType, LaborType toType, int count)
        {
            if (count <= 0 || fromType == toType) return false;

            int availableFrom = _laborDistribution.GetWorkerCount(fromType);
            if (count > availableFrom) count = availableFrom;

            if (count <= 0) return false;

            // النقل
            _laborDistribution.SetWorkerCount(fromType, availableFrom - count);
            _laborDistribution.SetWorkerCount(toType, _laborDistribution.GetWorkerCount(toType) + count);

            OnLaborDistributionChanged?.Invoke(_laborDistribution);
            return true;
        }

        /// <summary>
        /// تسريح عمال من قطاع معين (يصبحون عاطلين)
        /// </summary>
        public bool DismissWorkers(LaborType type, int count)
        {
            if (count <= 0) return false;

            int available = _laborDistribution.GetWorkerCount(type);
            if (count > available) count = available;

            if (count <= 0) return false;

            _laborDistribution.SetWorkerCount(type, available - count);
            _laborDistribution.unemployed += count;

            OnLaborDistributionChanged?.Invoke(_laborDistribution);
            return true;
        }

        /// <summary>
        /// إعادة توزيع العمالة بالكامل (يستخدمه القائد AI)
        /// </summary>
        public void RedistributeLabor(Dictionary<LaborType, int> newDistribution)
        {
            int totalRequested = 0;
            foreach (var kvp in newDistribution)
            {
                totalRequested += kvp.Value;
            }

            // التحقق من أن الطلب لا يتجاوز القوة العاملة المتاحة
            if (totalRequested > Workforce)
            {
                Debug.LogWarning($"[{_cityName}] Labor redistribution exceeds workforce. " +
                    $"Requested: {totalRequested}, Available: {Workforce}");
                return;
            }

            // تطبيق التوزيع الجديد
            _laborDistribution = new LaborDistribution
            {
                farmers = GetValueOrDefault(newDistribution, LaborType.Farming),
                merchants = GetValueOrDefault(newDistribution, LaborType.Commerce),
                industrialWorkers = GetValueOrDefault(newDistribution, LaborType.Industry),
                constructionWorkers = GetValueOrDefault(newDistribution, LaborType.Construction),
                miners = GetValueOrDefault(newDistribution, LaborType.Mining),
                priests = GetValueOrDefault(newDistribution, LaborType.Religion),
                researchers = GetValueOrDefault(newDistribution, LaborType.Research),
                unemployed = Workforce - totalRequested
            };

            OnLaborDistributionChanged?.Invoke(_laborDistribution);
        }

        private int GetValueOrDefault(Dictionary<LaborType, int> dict, LaborType key)
        {
            return dict.ContainsKey(key) ? dict[key] : 0;
        }

        // ==================== نظام التجنيد ====================

        /// <summary>
        /// تجنيد جنود من السكان المدنيين
        /// يقلل من القوة العاملة المتاحة ويخلق توازناً استراتيجياً
        /// </summary>
        public RecruitmentResult RecruitSoldiers(int requestedCount)
        {
            var result = new RecruitmentResult();

            if (requestedCount <= 0)
            {
                result.success = false;
                result.reason = "Invalid recruitment count";
                return result;
            }

            // 1. التحقق من الحد الأقصى للجنود
            if (_soldierCount + requestedCount > _militaryPopCap)
            {
                requestedCount = _militaryPopCap - _soldierCount;
                if (requestedCount <= 0)
                {
                    result.success = false;
                    result.reason = "Military population cap reached";
                    return result;
                }
            }

            // 2. التحقق من توفر بالغين
            int availableAdults = _demographics.adults - _soldierCount;
            if (requestedCount > availableAdults)
            {
                requestedCount = availableAdults;
                if (requestedCount <= 0)
                {
                    result.success = false;
                    result.reason = "No available adults to recruit";
                    return result;
                }
            }

            // 3. أخذ المجندين من العاطلين أولاً، ثم من العمال
            int fromUnemployed = Mathf.Min(_laborDistribution.unemployed, requestedCount);
            int remaining = requestedCount - fromUnemployed;

            // إذا لم يكفِ العاطلون، نسحب من القطاعات الأقل أهمية
            if (remaining > 0)
            {
                // سحب بنسب: 30% من الفلاحين، 25% من البناء، 20% من التعدين، 15% من الصناعة، 10% من الباقي
                remaining = TakeFromSector(LaborType.Construction, remaining, 0.25f);
                remaining = TakeFromSector(LaborType.Mining, remaining, 0.20f);
                remaining = TakeFromSector(LaborType.Farming, remaining, 0.30f);
                remaining = TakeFromSector(LaborType.Industry, remaining, 0.15f);
                remaining = TakeFromSector(LaborType.Commerce, remaining, 0.10f);
            }

            // 4. تحديث البيانات
            int actuallyRecruited = requestedCount - remaining;
            
            if (actuallyRecruited > 0)
            {
                _soldierCount += actuallyRecruited;
                _laborDistribution.unemployed -= fromUnemployed;

                // تأثير التجنيد على السعادة (سلبية)
                ModifyHappiness(-actuallyRecruited * 0.5f);

                result.success = true;
                result.recruitedCount = actuallyRecruited;
                result.fromUnemployed = fromUnemployed;
                result.fromWorkers = actuallyRecruited - fromUnemployed;

                OnSoldiersRecruited?.Invoke(actuallyRecruited);
            }
            else
            {
                result.success = false;
                result.reason = "Could not recruit any soldiers";
            }

            return result;
        }

        /// <summary>
        /// أخذ عمال من قطاع معين للتجنيد
        /// </summary>
        private int TakeFromSector(LaborType type, int needed, float ratio)
        {
            if (needed <= 0) return needed;

            int available = _laborDistribution.GetWorkerCount(type);
            int take = Mathf.Min(Mathf.RoundToInt(needed * ratio), available);

            if (take > 0)
            {
                _laborDistribution.SetWorkerCount(type, available - take);
                needed -= take;
            }

            return needed;
        }

        /// <summary>
        /// فقدان جنود (في المعركة)
        /// </summary>
        public void LoseSoldiers(int count)
        {
            if (count <= 0 || _soldierCount <= 0) return;

            int actualLoss = Mathf.Min(count, _soldierCount);
            _soldierCount -= actualLoss;

            // تأثير فقدان الجنود على السعادة والولاء
            ModifyHappiness(-actualLoss * 1.0f);
            ModifyLoyalty(-actualLoss * 0.3f);

            OnSoldiersLost?.Invoke(actualLoss);
        }

        /// <summary>
        /// تسريح جنود (يعودون كعمال عاطلين)
        /// </summary>
        public void DischargeSoldiers(int count)
        {
            if (count <= 0 || _soldierCount <= 0) return;

            int actualDischarge = Mathf.Min(count, _soldierCount);
            _soldierCount -= actualDischarge;
            _laborDistribution.unemployed += actualDischarge;

            // تأثير إيجابي على السعادة
            ModifyHappiness(actualDischarge * 0.3f);

            OnSoldiersLost?.Invoke(actualDischarge);
        }

        // ==================== نظام السعادة ====================

        /// <summary>
        /// تعديل مستوى السعادة
        /// </summary>
        public void ModifyHappiness(float amount)
        {
            float oldHappiness = _happiness;
            _happiness = Mathf.Clamp(_happiness + amount, 0f, 100f);
            
            UpdatePopulationStatus();
            
            if (Mathf.Abs(oldHappiness - _happiness) > 0.01f)
            {
                OnHappinessChanged?.Invoke(oldHappiness, _happiness);
            }
        }

        /// <summary>
        /// تعديل مستوى الولاء
        /// </summary>
        public void ModifyLoyalty(float amount)
        {
            _loyalty = Mathf.Clamp(_loyalty + amount, 0f, 100f);
        }

        /// <summary>
        /// تحديث حالة السكان بناءً على مستوى السعادة
        /// </summary>
        private void UpdatePopulationStatus()
        {
            PopulationStatus oldStatus = _currentStatus;

            if (_happiness >= 80f)
                _currentStatus = PopulationStatus.Enthusiastic;
            else if (_happiness >= 60f)
                _currentStatus = PopulationStatus.Happy;
            else if (_happiness >= 40f)
                _currentStatus = PopulationStatus.Normal;
            else if (_happiness >= 25f)
                _currentStatus = PopulationStatus.Discontent;
            else if (_happiness >= 10f)
                _currentStatus = PopulationStatus.Angry;
            else
                _currentStatus = PopulationStatus.Desperate;

            if (oldStatus != _currentStatus)
            {
                OnStatusChanged?.Invoke(oldStatus, _currentStatus);
                Debug.Log($"[{_cityName}] Population status changed: {oldStatus} -> {_currentStatus}");
            }
        }

        // ==================== نظام الإنتاج ====================

        /// <summary>
        /// حساب إنتاج المدينة الكلي لكل مورد
        /// يأخذ بعين الاعتبار توزيع العمالة ومعدلات الإنتاج وحالة السكان
        /// </summary>
        public CityProduction CalculateProduction()
        {
            // مضاعف الإنتاجية بناءً على حالة السكان
            float productivityMultiplier = GetProductivityMultiplier();

            var production = new CityProduction
            {
                // إنتاج الغذاء = فلاحون × معدل الإنتاج
                food = _laborDistribution.farmers * _productionRates.foodPerWorker * productivityMultiplier,
                
                // إنتاج الذهب = تجار × معدل الإنتاج
                gold = _laborDistribution.merchants * _productionRates.goldPerWorker * productivityMultiplier,
                
                // إنتاج البناء = عمال بناء × معدل الإنتاج
                production = _laborDistribution.constructionWorkers * _productionRates.productionPerWorker * productivityMultiplier,
                
                // إنتاج المواد = عمال مناجم × معدل الإنتاج
                materials = _laborDistribution.miners * _productionRates.materialsPerWorker * productivityMultiplier,
                
                // إنتاج الأبحاث = باحثون × معدل الإنتاج
                research = _laborDistribution.researchers * _productionRates.researchPerWorker * productivityMultiplier,
                
                // إنتاج السعادة = كهنة × معدل الإنتاج
                happiness = _laborDistribution.priests * _productionRates.happinessPerWorker,
                
                // استهلاك الغذاء = إجمالي السكان × معدل الاستهلاك
                foodConsumption = TotalPopulation * _foodConsumptionPerCapita,
                
                // صافي الغذاء
                foodNet = 0f
            };

            production.foodNet = production.food - production.foodConsumption;

            return production;
        }

        /// <summary>
        /// حساب مضاعف الإنتاجية بناءً على حالة السكان
        /// </summary>
        private float GetProductivityMultiplier()
        {
            return _currentStatus switch
            {
                PopulationStatus.Enthusiastic => 1.3f,
                PopulationStatus.Happy => 1.15f,
                PopulationStatus.Normal => 1.0f,
                PopulationStatus.Discontent => 0.8f,
                PopulationStatus.Angry => 0.6f,
                PopulationStatus.Desperate => 0.4f,
                _ => 1.0f
            };
        }

        // ==================== دوال المعلومات ====================

        /// <summary>
        /// الحصول على ملخص شامل لبيانات السكان
        /// </summary>
        public PopulationSummary GetSummary()
        {
            return new PopulationSummary
            {
                cityName = _cityName,
                totalPopulation = TotalPopulation,
                demographics = _demographics,
                laborDistribution = _laborDistribution,
                soldierCount = _soldierCount,
                workforce = Workforce,
                availableWorkforce = AvailableWorkforce,
                happiness = _happiness,
                loyalty = _loyalty,
                status = _currentStatus,
                production = CalculateProduction()
            };
        }

        // ==================== دورة التحديث (Turn Update) ====================

        /// <summary>
        /// تحديث كامل لنظام السكان - يُنفَّذ مرة كل دورة لعب
        /// </summary>
        public void OnTurnUpdate()
        {
            // 1. حساب الإنتاج
            var production = CalculateProduction();

            // 2. تحديث النمو السكاني
            UpdatePopulationGrowth(production.foodNet);

            // 3. تأثير السعادة من إنتاج المعابد
            ModifyHappiness(production.happiness);

            // 4. تأثير الولاء الطبيعي (انخفاض تدريجي إذا لم يكن هناك سبب)
            if (_loyalty > 50f)
            {
                ModifyLoyalty(-0.5f); // انخفاض طبيعي بسيط
            }

            // 5. تأثير حالة السكان على الولاء
            switch (_currentStatus)
            {
                case PopulationStatus.Discontent:
                    ModifyLoyalty(-1.0f); break;
                case PopulationStatus.Angry:
                    ModifyLoyalty(-2.0f); break;
                case PopulationStatus.Desperate:
                    ModifyLoyalty(-5.0f); break;
            }
        }
    }

    // ==================== هياكل النتائج ====================

    /// <summary>
    /// نتيجة عملية التجنيد
    /// </summary>
    public struct RecruitmentResult
    {
        public bool success;
        public int recruitedCount;
        public int fromUnemployed;
        public int fromWorkers;
        public string reason;
    }

    /// <summary>
    /// بيانات إنتاج المدينة
    /// </summary>
    public struct CityProduction
    {
        public float food;
        public float gold;
        public float production;
        public float materials;
        public float research;
        public float happiness;
        public float foodConsumption;
        public float foodNet;
    }

    /// <summary>
    /// ملخص شامل لبيانات السكان
    /// </summary>
    public struct PopulationSummary
    {
        public string cityName;
        public int totalPopulation;
        public PopulationDemographics demographics;
        public LaborDistribution laborDistribution;
        public int soldierCount;
        public int workforce;
        public int availableWorkforce;
        public float happiness;
        public float loyalty;
        public PopulationStatus status;
        public CityProduction production;
    }
}
