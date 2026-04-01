// =============================================================================
// PopulationData.cs
// هياكل البيانات الأساسية لنظام السكان
// يحتوي على: Enums, Structs, و Data Classes
// =============================================================================

using System;
using UnityEngine;

namespace GrandStrategyGame.PopulationSystem
{
    // ==================== أنواع (Enums) ====================

    /// <summary>
    /// أنواع العمل المتاحة للسكان
    /// كل نوع يؤثر على مورد مختلف في المدينة
    /// </summary>
    public enum LaborType
    {
        /// <summary>العمل في الحقول - يزيد إنتاج الغذاء</summary>
        Farming,
        
        /// <summary>العمل في الأسواق - يزيد الدخل الذهبي</summary>
        Commerce,
        
        /// <summary>العمل في المصانع - يزيد الإنتاج الصناعي</summary>
        Industry,
        
        /// <summary>العمل في البناء - يسرّع بناء المباني</summary>
        Construction,
        
        /// <summary>العمل في المناجم - يزيد استخراج المواد الخام</summary>
        Mining,
        
        /// <summary>العمل في المعابد - يزيد السعادة والولاء</summary>
        Religion,
        
        /// <summary>العمل في الأبحاث - يزيد التطور التكنولوجي</summary>
        Research
    }

    /// <summary>
    /// حالة السكان الحالية
    /// تؤثر على نمو السكان وإنتاجيتهم
    /// </summary>
    public enum PopulationStatus
    {
        /// <summary>سكان عاديون - إنتاجية قياسية</summary>
        Normal,
        
        /// <summary>سكان سعداء - نمو سكاني متزايد + إنتاجية أعلى</summary>
        Happy,
        
        /// <summary>سكان متحمسون - نمو سكاني عالي جداً + إنتاجية قصوى</summary>
        Enthusiastic,
        
        /// <summary>سكان متذمرون - انخفاض في الإنتاجية</summary>
        Discontent,
        
        /// <summary>سكان غاضبون - خطر تمرد + انخفاض حاد في الإنتاجية</summary>
        Angry,
        
        /// <summary>سكان يائسون - خطر هجرة + تمرد وشيك</summary>
        Desperate
    }

    /// <summary>
    /// فئة السكان (Social Class)
    /// تُستخدم في تحديد توزيع السكان وتأثيرهم الاقتصادي
    /// </summary>
    public enum PopulationClass
    {
        /// <summary>الفقراء - عمالة رخيصة لكن سعادة منخفضة</summary>
        Peasants,
        
        /// <summary>العمال - إنتاجية متوسطة</summary>
        Workers,
        
        /// <summary>التجار - يزيدون الدخل التجاري</summary>
        Merchants,
        
        /// <summary>الحرفيون - يزيدون الإنتاج الصناعي</summary>
        Artisans,
        
        /// <summary>الأثرياء - يزيدون الضرائب لكن قد ينخفض ولاؤهم</summary>
        Nobles
    }

    // ==================== هياكل البيانات (Structs) ====================

    /// <summary>
    /// بيانات السكان الأساسية لكل فئة عمرية
    /// </summary>
    [Serializable]
    public struct PopulationDemographics
    {
        [Tooltip("عدد الأطفال (0-14 سنة) - لا يعملون لكن يستهلكون غذاء")]
        public int children;
        
        [Tooltip("عدد البالغين (15-64 سنة) - القوة العاملة الرئيسية")]
        public int adults;
        
        [Tooltip("عدد كبار السن (65+ سنة) - يستهلكون موارد ولا يعملون")]
        public int elderly;

        /// <summary>
        /// إجمالي عدد السكان
        /// </summary>
        public int TotalPopulation => children + adults + elderly;
        
        /// <summary>
        /// نسبة القوة العاملة من إجمالي السكان
        /// </summary>
        public float WorkforceRatio => TotalPopulation > 0 ? (float)adults / TotalPopulation : 0f;
        
        /// <summary>
        /// نسبة الإعالة (الأطفال + كبار السن مقسومة على البالغين)
        /// كلما ارتفعت زاد الضغط الاقتصادي
        /// </summary>
        public float DependencyRatio => adults > 0 ? (float)(children + elderly) / adults : 999f;

        /// <summary>
        /// إنشاء ديموغرافيا أولية
        /// </summary>
        public static PopulationDemographics CreateInitial(int totalPopulation)
        {
            float childrenRatio = 0.30f;
            float adultsRatio = 0.60f;
            float elderlyRatio = 0.10f;

            return new PopulationDemographics
            {
                children = Mathf.RoundToInt(totalPopulation * childrenRatio),
                adults = Mathf.RoundToInt(totalPopulation * adultsRatio),
                elderly = Mathf.RoundToInt(totalPopulation * elderlyRatio)
            };
        }
    }

    /// <summary>
    /// توزيع العمالة على القطاعات المختلفة
    /// </summary>
    [Serializable]
    public struct LaborDistribution
    {
        [Tooltip("عدد العمال في الزراعة")]
        public int farmers;
        
        [Tooltip("عدد العمال في التجارة")]
        public int merchants;
        
        [Tooltip("عدد العمال في الصناعة")]
        public int industrialWorkers;
        
        [Tooltip("عدد العمال في البناء")]
        public int constructionWorkers;
        
        [Tooltip("عدد العمال في التعدين")]
        public int miners;
        
        [Tooltip("عدد العمال في المعابد")]
        public int priests;
        
        [Tooltip("عدد العمال في الأبحاث")]
        public int researchers;
        
        [Tooltip("عدد العمال العاطلين عن العمل")]
        public int unemployed;

        /// <summary>
        /// إجمالي عدد العمال الموزعين
        /// </summary>
        public int TotalWorkers => farmers + merchants + industrialWorkers + 
                                     constructionWorkers + miners + priests + researchers + unemployed;

        /// <summary>
        /// الحصول على عدد العمال في قطاع معين
        /// </summary>
        public int GetWorkerCount(LaborType type)
        {
            return type switch
            {
                LaborType.Farming => farmers,
                LaborType.Commerce => merchants,
                LaborType.Industry => industrialWorkers,
                LaborType.Construction => constructionWorkers,
                LaborType.Mining => miners,
                LaborType.Religion => priests,
                LaborType.Research => researchers,
                _ => 0
            };
        }

        /// <summary>
        /// تعيين عدد العمال في قطاع معين
        /// </summary>
        public void SetWorkerCount(LaborType type, int count)
        {
            count = Mathf.Max(0, count);
            
            switch (type)
            {
                case LaborType.Farming:
                    farmers = count; break;
                case LaborType.Commerce:
                    merchants = count; break;
                case LaborType.Industry:
                    industrialWorkers = count; break;
                case LaborType.Construction:
                    constructionWorkers = count; break;
                case LaborType.Mining:
                    miners = count; break;
                case LaborType.Religion:
                    priests = count; break;
                case LaborType.Research:
                    researchers = count; break;
            }
        }

        /// <summary>
        /// توزيع أولي متساوٍ للعمالة
        /// </summary>
        public static LaborDistribution CreateEqual(int totalWorkers)
        {
            int perSector = Mathf.FloorToInt(totalWorkers / 7f);
            int remainder = totalWorkers - (perSector * 7);

            return new LaborDistribution
            {
                farmers = perSector + remainder,
                merchants = perSector,
                industrialWorkers = perSector,
                constructionWorkers = perSector,
                miners = perSector,
                priests = perSector,
                researchers = perSector,
                unemployed = 0
            };
        }

        /// <summary>
        /// تحويل التوزيع إلى قاموس للمعالجة الأسهل
        /// </summary>
        public System.Collections.Generic.Dictionary<LaborType, int> ToDictionary()
        {
            return new System.Collections.Generic.Dictionary<LaborType, int>
            {
                { LaborType.Farming, farmers },
                { LaborType.Commerce, merchants },
                { LaborType.Industry, industrialWorkers },
                { LaborType.Construction, constructionWorkers },
                { LaborType.Mining, miners },
                { LaborType.Religion, priests },
                { LaborType.Research, researchers }
            };
        }
    }

    /// <summary>
    /// بيانات الإنتاج لكل قطاع عمالي
    /// </summary>
    [Serializable]
    public struct ProductionOutput
    {
        public float foodPerWorker;
        public float goldPerWorker;
        public float productionPerWorker;
        public float materialsPerWorker;
        public float researchPerWorker;
        public float happinessPerWorker;

        /// <summary>
        /// قيم الإنتاج الافتراضية
        /// </summary>
        public static ProductionOutput Default => new ProductionOutput
        {
            foodPerWorker = 2.0f,
            goldPerWorker = 1.5f,
            productionPerWorker = 1.0f,
            materialsPerWorker = 1.0f,
            researchPerWorker = 0.5f,
            happinessPerWorker = 0.3f
        };
    }

    /// <summary>
    /// معدلات النمو السكاني
    /// </summary>
    [Serializable]
    public struct PopulationGrowthRates
    {
        [Tooltip("معدل النمو الأساسي (نسبة مئوية لكل دورة)")]
        [Range(0f, 0.1f)]
        public float baseGrowthRate;
        
        [Tooltip("مكافأة النمو بسبب السعادة")]
        [Range(0f, 0.05f)]
        public float happinessBonus;
        
        [Tooltip("مكافأة النمو بسبب وفرة الغذاء")]
        [Range(0f, 0.05f)]
        public float foodSurplusBonus;
        
        [Tooltip("عقوبة النمو بسبب نقص الغذاء")]
        [Range(-0.1f, 0f)]
        public float foodDeficitPenalty;
        
        [Tooltip("حد أقصى للنمو (نسبة مئوية)")]
        [Range(0f, 0.15f)]
        public float maxGrowthRate;
        
        [Tooltip("حد أدنى للنمو (يمكن أن يكون سلبياً)")]
        [Range(-0.05f, 0f)]
        public float minGrowthRate;

        /// <summary>
        /// قيم افتراضية للعبة
        /// </summary>
        public static PopulationGrowthRates Default => new PopulationGrowthRates
        {
            baseGrowthRate = 0.02f,      // 2% نمو أساسي
            happinessBonus = 0.01f,       // 1% مكافأة سعادة
            foodSurplusBonus = 0.015f,    // 1.5% مكافأة غذاء
            foodDeficitPenalty = -0.05f,  // -5% عقوبة نقص غذاء
            maxGrowthRate = 0.10f,        // 10% حد أقصى
            minGrowthRate = -0.03f        // -3% حد أدنى (نقص سكاني)
        };
    }
}
