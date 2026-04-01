// =============================================================================
// CityResourceManager.cs
// مدير موارد المدينة - يتعامل مع الموارد والإنتاج والبناء
// =============================================================================

using System;
using System.Collections.Generic;
using UnityEngine;

namespace GrandStrategyGame
{
    /// <summary>
    /// أنواع الموارد في اللعبة
    /// </summary>
    public enum ResourceType
    {
        Food,
        Gold,
        Production,
        Materials,
        Research
    }

    /// <summary>
    /// مدير موارد المدينة
    /// يتعامل مع جمع الموارد وتوزيعها وإدارة البناء
    /// </summary>
    public class CityResourceManager
    {
        private readonly string _cityName;
        private readonly Dictionary<ResourceType, float> _storedResources;
        private readonly Dictionary<ResourceType, float> _productionRates;
        private readonly Dictionary<ResourceType, float> _consumptionRates;
        private readonly Queue<string> _buildQueue;
        
        public event Action<ResourceType, float> OnResourceChanged;

        public CityResourceManager(string cityName)
        {
            _cityName = cityName;
            _storedResources = new Dictionary<ResourceType, float>();
            _productionRates = new Dictionary<ResourceType, float>();
            _consumptionRates = new Dictionary<ResourceType, float>();
            _buildQueue = new Queue<string>();

            // تهيئة الموارد الأولية
            foreach (ResourceType type in Enum.GetValues(typeof(ResourceType)))
            {
                _storedResources[type] = 0f;
                _productionRates[type] = 0f;
                _consumptionRates[type] = 0f;
            }
            
            // موارد أولية
            _storedResources[ResourceType.Gold] = 200f;
            _storedResources[ResourceType.Food] = 100f;
        }

        /// <summary>
        /// إضافة مورد
        /// </summary>
        public void AddResource(ResourceType type, float amount)
        {
            _storedResources[type] += amount;
            OnResourceChanged?.Invoke(type, _storedResources[type]);
        }

        /// <summary>
        /// استهلاك مورد
        /// </summary>
        public bool ConsumeResource(ResourceType type, float amount)
        {
            if (_storedResources[type] >= amount)
            {
                _storedResources[type] -= amount;
                OnResourceChanged?.Invoke(type, _storedResources[type]);
                return true;
            }
            return false;
        }

        /// <summary>
        /// الحصول على كمية مورد مخزنة
        /// </summary>
        public float GetStoredAmount(ResourceType type)
        {
            return _storedResources.ContainsKey(type) ? _storedResources[type] : 0f;
        }

        /// <summary>
        /// تحديث الموارد كل دورة
        /// </summary>
        public void OnTurnUpdate()
        {
            foreach (ResourceType type in Enum.GetValues(typeof(ResourceType)))
            {
                float net = _productionRates[type] - _consumptionRates[type];
                _storedResources[type] = Mathf.Max(0f, _storedResources[type] + net);
            }
        }

        /// <summary>
        /// إضافة بناء للطابور
        /// </summary>
        public void QueueBuilding(string buildingType)
        {
            _buildQueue.Enqueue(buildingType);
        }
    }
}
