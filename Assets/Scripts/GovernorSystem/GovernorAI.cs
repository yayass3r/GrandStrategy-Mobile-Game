// =============================================================================
// GovernorAI.cs
// نظام الذكاء الاصطناعي للقادة (Autonomous Governors AI)
// يتحكم في: سلوك القادة الاقتصاديين والحربيين والدفاعيين
// =============================================================================

using System;
using System.Collections.Generic;
using UnityEngine;
using Random = UnityEngine.Random;

namespace GrandStrategyGame.GovernorSystem
{
    // ==================== أنواع القادة ====================

    /// <summary>
    /// أنواع القادة المختلفين
    /// كل نوع له سلوك AI مختلف في إدارة المدينة
    /// </summary>
    public enum GovernorType
    {
        /// <summary>القائد الاقتصادي: يركز على التجارة والغذاء والدخل</summary>
        Economic,
        
        /// <summary>القائد الحربي الهجومي: يجند جنود ويجهز جيوش</summary>
        Military,
        
        /// <summary>القائد الدفاعي: يبني تحصينات ويحافظ على حاميات</summary>
        Defensive
    }

    /// <summary>
    /// حالة القائد الحالية
    /// </summary>
    public enum GovernorState
    {
        Idle,
        Developing,
        Recruiting,
        BuildingDefense,
        Trading,
        PreparingAttack,
        ReactingToThreat
    }

    // ==================== السمات ====================

    /// <summary>
    /// سمات القائد - تؤثر على أدائه وكيفية إدارة المدينة
    /// يمكن أن تكون إيجابية أو سلبية
    /// </summary>
    [Serializable]
    public enum TraitType
    {
        // سمات إيجابية
        Charismatic,        // كاريزمي: يزيد السعادة +15%
        Brilliant,          // عبقري: يزيد الإنتاج +10%
        Frugal,             // مقتصد: يقلل الاستهلاك -10%
        Inspiring,          // ملهم: يزيد الولاء +20%
        Energetic,          // نشيط: سرعة بناء +25%
        Lucky,              // محظوظ: أحداث عشوائية إيجابية
        Experienced,        // ذو خبرة: كفاءة عامة +15%
        Loyal,              // مخلص: ولاء لا ينخفض تحت 50
        
        // سمات سلبية
        Corrupt,            // فاسد: يقلل الدخل -20%
        Cruel,              // قاسي: ينقص السعادة -15%
        Lazy,               // كسول: سرعة بناء -20%
        Reckless,           // متهور: يجند أكثر من اللازم
        Cowardly,           // جبان: لا يبني جيش كافٍ
        Greedy,             // طماع: يزيد الضرائب
        Incompetent,        // غير كفؤ: كفاءة عامة -15%
        Ambitious,          // طموح: ولاء ينخفض تدريجياً
        
        // سمات محايدة
        Cautious,           // حذر: يبني دفاعات أولاً
        Diplomatic,         // دبلوماسي: يحسن العلاقات
        Traditional,        // تقليدي: يفضل المباني القديمة
    }

    /// <summary>
    /// بيانات سمة القائد مع قيمتها
    /// </summary>
    [Serializable]
    public struct GovernorTrait
    {
        public TraitType type;
        public float magnitude; // قوة السمة (0.0 - 2.0)
        
        /// <summary>
        /// هل السمة إيجابية؟
        /// </summary>
        public bool IsPositive
        {
            get
            {
                return type switch
                {
                    TraitType.Charismatic => true,
                    TraitType.Brilliant => true,
                    TraitType.Frugal => true,
                    TraitType.Inspiring => true,
                    TraitType.Energetic => true,
                    TraitType.Lucky => true,
                    TraitType.Experienced => true,
                    TraitType.Loyal => true,
                    _ => false
                };
            }
        }

        /// <summary>
        /// وصف السمة
        /// </summary>
        public string Description => type switch
        {
            TraitType.Charismatic => $"يزيد السعادة بنسبة {magnitude * 15}%",
            TraitType.Brilliant => $"يزيد الإنتاج بنسبة {magnitude * 10}%",
            TraitType.Frugal => $"يقلل الاستهلاك بنسبة {magnitude * 10}%",
            TraitType.Inspiring => $"يزيد الولاء بنسبة {magnitude * 20}%",
            TraitType.Energetic => $"يسرّع البناء بنسبة {magnitude * 25}%",
            TraitType.Lucky => $"يزيد فرص الأحداث الإيجابية بنسبة {magnitude * 20}%",
            TraitType.Experienced => $"يزيد الكفاءة العامة بنسبة {magnitude * 15}%",
            TraitType.Loyal => $"الولاء لا ينخفض تحت {50 * (2 - magnitude)}%",
            TraitType.Corrupt => $"يقلل الدخل بنسبة {magnitude * 20}%",
            TraitType.Cruel => $"ينقص السعادة بنسبة {magnitude * 15}%",
            TraitType.Lazy => $"يبطئ البناء بنسبة {magnitude * 20}%",
            TraitType.Reckless => $"يجند بنسبة {1 + magnitude * 50}% أكثر",
            TraitType.Cowardly => $"يجند بنسبة {1 - magnitude * 30}% أقل",
            TraitType.Greedy => $"يفرض ضرائب إضافية بنسبة {magnitude * 10}%",
            TraitType.Incompetent => $"يقلل الكفاءة العامة بنسبة {magnitude * 15}%",
            TraitType.Ambitious => $"الولاء ينخفض بنسبة {magnitude * 2}% شهرياً",
            _ => "بدون تأثير مباشر"
        };
    }

    // ==================== بيانات القائد ====================

    /// <summary>
    /// بيانات القائد الكاملة
    /// </summary>
    [Serializable]
    public class GovernorData
    {
        [Header("=== Identity ===")]
        public string governorName;
        public GovernorType type;
        public int level;
        public float experience;
        public string cityName;

        [Header("=== Stats ===")]
        [Range(0f, 100f)]
        public float loyalty;
        public float competence; // الكفاءة العامة (تتأثر بالسمات والمستوى)

        [Header("=== Traits ===")]
        public List<GovernorTrait> traits;
        
        [Header("=== State ===")]
        public GovernorState currentState;
        public string currentAction;
        public int turnsInOffice;

        // ==================== الخصائص المحسوبة ====================

        /// <summary>
        /// حساب الكفاءة الفعالة بناءً على المستوى والسمات
        /// </summary>
        public float EffectiveCompetence
        {
            get
            {
                float baseCompetence = 50f + (level * 5f);
                baseCompetence = Mathf.Min(baseCompetence, 100f);

                foreach (var trait in traits)
                {
                    if (trait.type == TraitType.Experienced)
                        baseCompetence += trait.magnitude * 15f;
                    if (trait.type == TraitType.Incompetent)
                        baseCompetence -= trait.magnitude * 15f;
                }

                return Mathf.Clamp(baseCompetence, 10f, 100f);
            }
        }

        /// <summary>
        /// نسبة الكفاءة (0.1 إلى 2.0)
        /// </summary>
        public float CompetenceMultiplier => EffectiveCompetence / 100f;

        /// <summary>
        /// حساب ميل العدوانية (Military: عالي، Defensive: منخفض، Economic: متوسط)
        /// </summary>
        public float AggressionLevel => type switch
        {
            GovernorType.Military => 0.8f,
            GovernorType.Defensive => 0.2f,
            GovernorType.Economic => 0.3f,
            _ => 0.5f
        };
    }

    // ==================== القاعدة المجردة للقادة ====================

    /// <summary>
    /// BaseGovernorAI: الفئة الأساسية المجردة لجميع أنواع القادة.
    /// تحدد السلوك الأساسي المشترك بين جميع القادة، وتترك التفاصيل
    /// للفئات المشتقة (الاقتصادي، الحربي، الدفاعي).
    /// </summary>
    public abstract class BaseGovernorAI
    {
        protected GovernorData _data;
        protected PopulationSystem.PopulationManager _populationManager;
        protected CityResourceManager _resourceManager;
        protected float _decisionTimer;

        // ==================== أحداث القائد ====================
        
        /// <summary>
        /// يُطلق عندما يتخذ القائد قراراً مهماً
        /// </summary>
        public event Action<string, string> OnGovernorDecision; // (cityName, decisionDescription)
        
        /// <summary>
        /// يُطلق عندما يطلب القائد موارد من القائد الأعلى
        /// </summary>
        public event Action<string, Dictionary<string, float>> OnResourceRequest; // (cityName, resources)
        
        /// <summary>
        /// يُطلق عندما يرسل القائد تقريراً
        /// </summary>
        public event Action<string, string> OnGovernorReport; // (cityName, report)

        // ==================== الخصائص ====================

        public GovernorData Data => _data;
        public string CityName => _data.cityName;
        public GovernorType Type => _data.type;
        public float Loyalty => _data.loyalty;

        // ==================== البناء ====================

        protected BaseGovernorAI(GovernorData data, PopulationSystem.PopulationManager popManager)
        {
            _data = data;
            _populationManager = popManager;
            _data.turnsInOffice = 0;
        }

        // ==================== دورة القرار ====================

        /// <summary>
        /// التحديث الرئيسي - يُنفَّذ كل دورة (Turn)
        /// </summary>
        public virtual void OnTurnUpdate()
        {
            _data.turnsInOffice++;

            // 1. تطبيق تأثيرات السمات
            ApplyTraitEffects();

            // 2. تقييم الوضع الحالي
            EvaluateSituation();

            // 3. اتخاذ القرارات
            MakeDecisions();

            // 4. تنفيذ القرارات
            ExecuteDecisions();

            // 5. إعداد التقرير
            GenerateReport();
        }

        /// <summary>
        /// تقييم الوضع الحالي للمدينة
        /// </summary>
        protected abstract void EvaluateSituation();

        /// <summary>
        /// اتخاذ القرارات بناءً على التقييم
        /// </summary>
        protected abstract void MakeDecisions();

        /// <summary>
        /// تنفيذ القرارات المتخذة
        /// </summary>
        protected abstract void ExecuteDecisions();

        // ==================== تطبيق السمات ====================

        /// <summary>
        /// تطبيق تأثيرات سمات القائد على المدينة
        /// </summary>
        protected void ApplyTraitEffects()
        {
            foreach (var trait in _data.traits)
            {
                switch (trait.type)
                {
                    case TraitType.Charismatic:
                        _populationManager.ModifyHappiness(trait.magnitude * 0.5f);
                        break;
                        
                    case TraitType.Cruel:
                        _populationManager.ModifyHappiness(-trait.magnitude * 0.5f);
                        break;
                        
                    case TraitType.Inspiring:
                        _populationManager.ModifyLoyalty(trait.magnitude * 0.3f);
                        break;
                        
                    case TraitType.Ambitious:
                        _populationManager.ModifyLoyalty(-trait.magnitude * 0.1f);
                        break;
                        
                    case TraitType.Corrupt:
                        // يُطبق على مستوى الموارد (يتم التعامل معه في Resource Manager)
                        break;
                }
            }
        }

        // ==================== توزيع العمالة ====================

        /// <summary>
        /// توزيع العمالة حسب أولويات القائد
        /// كل نوع قائد يعطي أوزان مختلفة للقطاعات
        /// </summary>
        protected void DistributeLabor(Dictionary<PopulationSystem.LaborType, float> priorities)
        {
            int totalWorkforce = _populationManager.Workforce;
            if (totalWorkforce <= 0) return;

            // حساب الوزن الكلي
            float totalWeight = 0f;
            foreach (var kvp in priorities)
            {
                totalWeight += kvp.Value;
            }

            if (totalWeight <= 0) return;

            // توزيع العمالة بناءً على الأوزان
            var distribution = new Dictionary<PopulationSystem.LaborType, int>();
            int assigned = 0;

            foreach (var kvp in priorities)
            {
                float ratio = kvp.Value / totalWeight;
                int workers = Mathf.RoundToInt(totalWorkforce * ratio);
                
                // تجنب إعطاء صفر عمال لقطاع له وزن
                if (workers == 0 && kvp.Value > 0) workers = 1;
                
                distribution[kvp.Key] = workers;
                assigned += workers;
            }

            // ضبط الفروق بسبب التقريب
            if (assigned != totalWorkforce)
            {
                // إضافة/طرح الفرق من القطاع ذو الوزن الأعلى
                PopulationSystem.LaborType maxSector = PopulationSystem.LaborType.Farming;
                float maxWeight = 0f;
                
                foreach (var kvp in priorities)
                {
                    if (kvp.Value > maxWeight)
                    {
                        maxWeight = kvp.Value;
                        maxSector = kvp.Key;
                    }
                }
                
                distribution[maxSector] += (totalWorkforce - assigned);
            }

            _populationManager.RedistributeLabor(distribution);
            
            OnGovernorDecision?.Invoke(_data.cityName, $"Redistributed workforce based on {Type} priorities");
        }

        // ==================== التجنيد ====================

        /// <summary>
        /// قرار تجنيد جنود
        /// </summary>
        protected void DecideRecruitment(float recruitmentPriority)
        {
            int availableWorkforce = _populationManager.AvailableWorkforce;
            int maxRecruit = Mathf.RoundToInt(availableWorkforce * recruitmentPriority);

            if (maxRecruit > 0)
            {
                var result = _populationManager.RecruitSoldiers(maxRecruit);
                if (result.success)
                {
                    OnGovernorDecision?.Invoke(_data.cityName, 
                        $"Recruited {result.recruitedCount} soldiers");
                }
            }
        }

        // ==================== التقرير ====================

        /// <summary>
        /// إنشاء تقرير عن حالة المدينة
        /// </summary>
        protected void GenerateReport()
        {
            var summary = _populationManager.GetSummary();
            string report = $"[Turn {_data.turnsInOffice}] " +
                $"Pop: {summary.totalPopulation}, " +
                $"Happiness: {summary.happiness:F0}%, " +
                $"Loyalty: {summary.loyalty:F0}%, " +
                $"Soldiers: {summary.soldierCount}, " +
                $"Food Net: {summary.production.foodNet:F1}, " +
                $"Gold: {summary.production.gold:F1}";

            OnGovernorReport?.Invoke(_data.cityName, report);
        }
    }

    // ==================== القائد الاقتصادي ====================

    /// <summary>
    /// EconomicGovernorAI: القائد الاقتصادي - يركز على:
    /// 1. بناء الأسواق وزيادة الدخل التجاري
    /// 2. توفير الغذاء الكافي للنمو السكاني
    /// 3. زيادة السعادة لتحسين الإنتاجية
    /// 4. تجنب التجنيد المفرط للحفاظ على القوة العاملة
    /// 
    /// أولويات توزيع العمالة:
    /// - التجارة (أعلى وزن)
    /// - الزراعة (مرتفع)
    /// - المعابد (متوسط) للحفاظ على السعادة
    /// - الصناعة (متوسط)
    /// - البناء (منخفض)
    /// - التعدين (منخفض)
    /// - الأبحاث (منخفض)
    /// </summary>
    public class EconomicGovernorAI : BaseGovernorAI
    {
        private float _economicUrgency; // مستوى الإلحاح الاقتصادي

        public EconomicGovernorAI(GovernorData data, PopulationSystem.PopulationManager popManager)
            : base(data, popManager)
        {
            _data.currentState = GovernorState.Developing;
        }

        protected override void EvaluateSituation()
        {
            var summary = _populationManager.GetSummary();
            
            // تقييم الوضع الاقتصادي
            if (summary.production.foodNet < 0)
            {
                _economicUrgency = 1.0f; // أزمة غذائية!
                _data.currentState = GovernorState.ReactingToThreat;
            }
            else if (summary.happiness < 30f)
            {
                _economicUrgency = 0.8f; // أزمة سعادة
                _data.currentState = GovernorState.ReactingToThreat;
            }
            else if (summary.availableWorkforce > 20)
            {
                _economicUrgency = 0.3f; // يمكن تطوير المزيد
                _data.currentState = GovernorState.Developing;
            }
            else
            {
                _economicUrgency = 0f;
                _data.currentState = GovernorState.Trading;
            }
        }

        protected override void MakeDecisions()
        {
            // 1. إذا كان هناك أزمة غذائية، أعطِ الأولوية للزراعة
            if (_economicUrgency >= 1.0f)
            {
                var priorities = new Dictionary<PopulationSystem.LaborType, float>
                {
                    { PopulationSystem.LaborType.Farming, 5.0f },
                    { PopulationSystem.LaborType.Commerce, 2.0f },
                    { PopulationSystem.LaborType.Construction, 1.0f },
                    { PopulationSystem.LaborType.Mining, 0.5f },
                    { PopulationSystem.LaborType.Religion, 1.5f },
                    { PopulationSystem.LaborType.Industry, 0.5f },
                    { PopulationSystem.LaborType.Research, 0.3f }
                };
                DistributeLabor(priorities);
                _data.currentAction = "Addressing food crisis";
            }
            // 2. الوضع العادي: تفضيل التجارة مع توازن غذائي
            else
            {
                float commerceWeight = 4.0f + (_data.CompetenceMultiplier * 1.0f);
                float farmingWeight = 3.0f;
                float religionWeight = _populationManager.Happiness < 60f ? 2.0f : 1.0f;
                
                var priorities = new Dictionary<PopulationSystem.LaborType, float>
                {
                    { PopulationSystem.LaborType.Commerce, commerceWeight },
                    { PopulationSystem.LaborType.Farming, farmingWeight },
                    { PopulationSystem.LaborType.Industry, 1.5f },
                    { PopulationSystem.LaborType.Construction, 1.5f },
                    { PopulationSystem.LaborType.Mining, 1.0f },
                    { PopulationSystem.LaborType.Religion, religionWeight },
                    { PopulationSystem.LaborType.Research, 1.0f }
                };
                DistributeLabor(priorities);
                _data.currentAction = "Focusing on trade and growth";
            }

            // 3. قرار التجنيد (أولوية منخفضة جداً)
            DecideRecruitment(0.05f); // 5% فقط من العاطلين
        }

        protected override void ExecuteDecisions()
        {
            // القائد الاقتصادي لا يحتاج تنفيذ إضافي
            // التوزيع تم في MakeDecisions
        }
    }

    // ==================== القائد الحربي الهجومي ====================

    /// <summary>
    /// MilitaryGovernorAI: القائد الحربي الهجومي - يركز على:
    /// 1. بناء الثكنات وتجنيد الجنود بكثافة
    /// 2. تجهيز جيوش للزحف والهجوم
    /// 3. الصناعة الحربية (أسلحة ودروع)
    /// 4. يتجاهل السعادة والاقتصاد إلى حد كبير
    /// 
    /// أولويات توزيع العمالة:
    /// - الصناعة (أعلى وزن) للأسلحة
    /// - البناء (مرتفع) للثكنات
    /// - التعدين (مرتفع) للمواد الخام
    /// - الزراعة (متوسط) - الحد الأدنى لإطعام الجيش
    /// - التجارة (منخفض)
    /// </summary>
    public class MilitaryGovernorAI : BaseGovernorAI
    {
        private float _militaryReadiness; // مستوى الجاهزية العسكرية
        private bool _preparingAttack;

        public MilitaryGovernorAI(GovernorData data, PopulationSystem.PopulationManager popManager)
            : base(data, popManager)
        {
            _data.currentState = GovernorState.Recruiting;
            _preparingAttack = false;
        }

        protected override void EvaluateSituation()
        {
            var summary = _populationManager.GetSummary();
            
            // حساب الجاهزية العسكرية
            float soldierRatio = summary.totalPopulation > 0 
                ? (float)summary.soldierCount / summary.totalPopulation 
                : 0f;
            
            _militaryReadiness = soldierRatio;

            // إذا كان الجيش كبيراً بما يكفي، جهّز للهجوم
            if (soldierRatio >= 0.25f && _populationManager.Happiness > 40f)
            {
                _preparingAttack = true;
                _data.currentState = GovernorState.PreparingAttack;
            }
            else if (soldierRatio >= 0.15f)
            {
                _data.currentState = GovernorState.Recruiting;
            }
            else
            {
                _data.currentState = GovernorState.Recruiting;
            }

            // تحقق من أزمة غذاء خطيرة
            if (summary.production.foodNet < -10f)
            {
                _data.currentState = GovernorState.ReactingToThreat;
            }
        }

        protected override void MakeDecisions()
        {
            // 1. توزيع العمالة لصالح الجيش
            float industryWeight = 4.0f + (_data.CompetenceMultiplier * 1.5f);
            float constructionWeight = 3.0f;
            float miningWeight = 2.5f;
            
            // التأكد من حد أدنى للغذاء
            var summary = _populationManager.GetSummary();
            float farmingWeight = summary.production.foodNet < 0 ? 3.0f : 1.5f;

            var priorities = new Dictionary<PopulationSystem.LaborType, float>
            {
                { PopulationSystem.LaborType.Industry, industryWeight },
                { PopulationSystem.LaborType.Construction, constructionWeight },
                { PopulationSystem.LaborType.Mining, miningWeight },
                { PopulationSystem.LaborType.Farming, farmingWeight },
                { PopulationSystem.LaborType.Commerce, 0.5f },
                { PopulationSystem.LaborType.Religion, 0.3f },
                { PopulationSystem.LaborType.Research, 0.2f }
            };
            DistributeLabor(priorities);

            // 2. قرار التجنيد (أولوية عالية!)
            float recruitPriority = _preparingAttack ? 0.6f : 0.3f;
            
            // القائد المتهور يجند أكثر
            foreach (var trait in _data.traits)
            {
                if (trait.type == TraitType.Reckless)
                    recruitPriority *= (1f + trait.magnitude * 0.5f);
                if (trait.type == TraitType.Cowardly)
                    recruitPriority *= (1f - trait.magnitude * 0.3f);
            }

            DecideRecruitment(recruitPriority);

            _data.currentAction = _preparingAttack 
                ? "Preparing military forces for attack" 
                : "Recruiting and training soldiers";
        }

        protected override void ExecuteDecisions()
        {
            // عند تجهيز الهجوم، طلب موارد إضافية
            if (_preparingAttack)
            {
                var request = new Dictionary<string, float>
                {
                    { "gold", 100f },
                    { "materials", 50f }
                };
                OnResourceRequest?.Invoke(_data.cityName, request);
            }
        }
    }

    // ==================== القائد الدفاعي ====================

    /// <summary>
    /// DefensiveGovernorAI: القائد الدفاعي - يركز على:
    /// 1. بناء الأسوار والتحصينات لحماية المدينة
    /// 2. الحفاظ على حامية عسكرية كافية (ليست كبيرة)
    /// 3. توفير غذاء كافٍ لحصار طويل محتمل
    /// 4. الحفاظ على سعادة السكان لمنع التمرد أثناء الحصار
    /// 
    /// أولويات توزيع العمالة:
    /// - الزراعة (أعلى وزن) لادخار الغذاء
    /// - البناء (مرتفع) للتحصينات
    /// - التعدين (متوسط) للمواد الدفاعية
    /// - المعابد (متوسط) للسعادة
    /// </summary>
    public class DefensiveGovernorAI : BaseGovernorAI
    {
        private float _defenseLevel;
        private float _siegeReadiness;

        public DefensiveGovernorAI(GovernorData data, PopulationSystem.PopulationManager popManager)
            : base(data, popManager)
        {
            _data.currentState = GovernorState.BuildingDefense;
        }

        protected override void EvaluateSituation()
        {
            var summary = _populationManager.GetSummary();
            
            // تقييم مدى جاهزية الحصار
            float foodReserve = summary.production.foodNet;
            _siegeReadiness = foodReserve > 0 ? Mathf.Min(1f, foodReserve / 20f) : 0f;

            // تقييم مستوى الدفاع
            float soldierRatio = summary.totalPopulation > 0
                ? (float)summary.soldierCount / summary.totalPopulation
                : 0f;
            _defenseLevel = soldierRatio >= 0.10f ? 1f : soldierRatio / 0.10f;

            // تحديد الحالة
            if (_siegeReadiness < 0.3f || _defenseLevel < 0.3f)
            {
                _data.currentState = GovernorState.BuildingDefense;
            }
            else if (_siegeReadiness >= 0.8f && _defenseLevel >= 0.8f)
            {
                _data.currentState = GovernorState.Idle;
            }
            else
            {
                _data.currentState = GovernorState.BuildingDefense;
            }
        }

        protected override void MakeDecisions()
        {
            var summary = _populationManager.GetSummary();

            // 1. توزيع العمالة: توازن بين الدفاع والغذاء
            float farmingWeight = 3.5f; // غذاء للحصار
            float constructionWeight = 3.0f; // بناء تحصينات
            
            // إذا كان الغذاء كافياً، ركّز على البناء
            if (_siegeReadiness >= 0.7f)
            {
                constructionWeight += 1.0f;
            }
            // إذا كان الغذاء ناقصاً، ركّز على الزراعة
            else if (_siegeReadiness < 0.3f)
            {
                farmingWeight += 2.0f;
            }

            var priorities = new Dictionary<PopulationSystem.LaborType, float>
            {
                { PopulationSystem.LaborType.Farming, farmingWeight },
                { PopulationSystem.LaborType.Construction, constructionWeight },
                { PopulationSystem.LaborType.Mining, 2.0f },
                { PopulationSystem.LaborType.Religion, 1.5f },
                { PopulationSystem.LaborType.Industry, 1.0f },
                { PopulationSystem.LaborType.Commerce, 0.8f },
                { PopulationSystem.LaborType.Research, 0.3f }
            };
            DistributeLabor(priorities);

            // 2. قرار التجنيد (حامية معتدلة)
            float recruitPriority = _defenseLevel < 0.5f ? 0.15f : 0.05f;
            DecideRecruitment(recruitPriority);

            _data.currentAction = "Fortifying city and stockpiling resources";
        }

        protected override void ExecuteDecisions()
        {
            // القائد الدفاعي لا يطلب موارد إضافية عادة
            // لكنه قد يطلب مواد بناء عند الحاجة
            if (_defenseLevel < 0.3f)
            {
                var request = new Dictionary<string, float>
                {
                    { "materials", 30f }
                };
                OnResourceRequest?.Invoke(_data.cityName, request);
            }
        }
    }

    // ==================== مُصنّع القادة ====================

    /// <summary>
    /// GovernorFactory: يُنشئ قادة جدد مع سمات عشوائية
    /// </summary>
    public static class GovernorFactory
    {
        // أسماء القادة حسب النوع
        private static readonly string[] EconomicNames = {
            "محمد التاجر", "سليمان الثري", "أحمد الحكيم", 
            "خالد المستشار", "عمر الحاسب", "يوسف المالي"
        };
        
        private static readonly string[] MilitaryNames = {
            "صلاح الدين", "طارق بن زياد", "خالد بن الوليد",
            "نور الدين", "بدر الدين", "عقبة بن نافع"
        };
        
        private static readonly string[] DefensiveNames = {
            "مصعب الحارس", "عثمان الدرع", "حمزة المحامي",
            "علي المتحصن", "سعد الحامي", "معاوية الخندق"
        };

        /// <summary>
        /// إنشاء قائد جديد من نوع محدد
        /// </summary>
        public static GovernorData CreateGovernor(GovernorType type, string cityName)
        {
            var data = new GovernorData
            {
                governorName = GetRandomName(type),
                type = type,
                level = 1,
                experience = 0f,
                cityName = cityName,
                loyalty = Random.Range(60f, 85f),
                competence = 50f,
                currentState = GovernorState.Idle,
                currentAction = "Just assigned",
                turnsInOffice = 0,
                traits = GenerateRandomTraits(type)
            };

            return data;
        }

        /// <summary>
        /// الحصول على اسم عشوائي حسب نوع القائد
        /// </summary>
        private static string GetRandomName(GovernorType type)
        {
            string[] names = type switch
            {
                GovernorType.Economic => EconomicNames,
                GovernorType.Military => MilitaryNames,
                GovernorType.Defensive => DefensiveNames,
                _ => EconomicNames
            };
            return names[Random.Range(0, names.Length)];
        }

        /// <summary>
        /// توليد سمات عشوائية للقائد
        /// 1-3 سمات، على الأقل واحدة إيجابية
        /// </summary>
        private static List<GovernorTrait> GenerateRandomTraits(GovernorType type)
        {
            var traits = new List<GovernorTrait>();
            int traitCount = Random.Range(1, 4); // 1-3 سمات

            // ضمان سمة إيجابية واحدة على الأقل
            bool hasPositive = false;

            for (int i = 0; i < traitCount; i++)
            {
                TraitType traitType = GetRandomTraitType(type);
                float magnitude = Random.Range(0.5f, 1.5f);

                var trait = new GovernorTrait
                {
                    type = traitType,
                    magnitude = magnitude
                };

                if (trait.IsPositive) hasPositive = true;
                traits.Add(trait);
            }

            // إذا لم يكن هناك سمة إيجابية، أضف واحدة
            if (!hasPositive)
            {
                TraitType positiveTrait = Random.Range(0f, 1f) > 0.5f 
                    ? TraitType.Experienced 
                    : TraitType.Charismatic;
                    
                traits.Add(new GovernorTrait
                {
                    type = positiveTrait,
                    magnitude = Random.Range(0.5f, 1.0f)
                });
            }

            return traits;
        }

        /// <summary>
        /// الحصول على نوع سمة عشوائي (مع تفضيل سمات نوع القائد)
        /// </summary>
        private static TraitType GetRandomTraitType(GovernorType governorType)
        {
            // 70% فرصة لسمة مناسبة لنوع القائد، 30% لأي سمة
            if (Random.Range(0f, 1f) < 0.7f)
            {
                return governorType switch
                {
                    GovernorType.Economic => GetRandomEconomicTrait(),
                    GovernorType.Military => GetRandomMilitaryTrait(),
                    GovernorType.Defensive => GetRandomDefensiveTrait(),
                    _ => GetRandomAnyTrait()
                };
            }
            return GetRandomAnyTrait();
        }

        private static TraitType GetRandomEconomicTrait()
        {
            TraitType[] options = {
                TraitType.Charismatic, TraitType.Brilliant, TraitType.Frugal,
                TraitType.Cruel, TraitType.Greedy, TraitType.Incompetent,
                TraitType.Inspiring, TraitType.Experienced
            };
            return options[Random.Range(0, options.Length)];
        }

        private static TraitType GetRandomMilitaryTrait()
        {
            TraitType[] options = {
                TraitType.Energetic, TraitType.Brilliant, TraitType.Experienced,
                TraitType.Reckless, TraitType.Cruel, TraitType.Cowardly,
                TraitType.Lazy, TraitType.Inspiring
            };
            return options[Random.Range(0, options.Length)];
        }

        private static TraitType GetRandomDefensiveTrait()
        {
            TraitType[] options = {
                TraitType.Cautious, TraitType.Experienced, TraitType.Loyal,
                TraitType.Brilliant, TraitType.Lazy, TraitType.Frugal,
                TraitType.Cowardly, TraitType.Inspiring
            };
            return options[Random.Range(0, options.Length)];
        }

        private static TraitType GetRandomAnyTrait()
        {
            Array values = Enum.GetValues(typeof(TraitType));
            return (TraitType)values.GetValue(Random.Range(0, values.Length));
        }

        /// <summary>
        /// إنشاء القائد AI المناسب من البيانات
        /// </summary>
        public static BaseGovernorAI CreateAIFromData(
            GovernorData data, 
            PopulationSystem.PopulationManager popManager)
        {
            return data.type switch
            {
                GovernorType.Economic => new EconomicGovernorAI(data, popManager),
                GovernorType.Military => new MilitaryGovernorAI(data, popManager),
                GovernorType.Defensive => new DefensiveGovernorAI(data, popManager),
                _ => new EconomicGovernorAI(data, popManager)
            };
        }
    }
}
