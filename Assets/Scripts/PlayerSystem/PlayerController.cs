// =============================================================================
// PlayerController.cs
// نظام القائد الأعلى (Supreme Commander / Player Controller)
// يتحكم في: الخريطة العالمية، تعيين القادة، الميزانية العامة
// =============================================================================

using System;
using System.Collections.Generic;
using UnityEngine;

namespace GrandStrategyGame.PlayerSystem
{
    // ==================== أنواع الأوامر ====================

    /// <summary>
    /// أوامر اللاعب الرئيسية
    /// </summary>
    public enum PlayerCommandType
    {
        AssignGovernor,
        DismissGovernor,
        MoveArmy,
        SetTaxRate,
        BuildInCity,
        DeclareWar,
        MakePeace,
        TradeRequest,
        FocusResearch
    }

    /// <summary>
    /// هيكل الأمر الذي يرسله اللاعب
    /// </summary>
    public struct PlayerCommand
    {
        public PlayerCommandType type;
        public string targetCity;
        public Dictionary<string, object> parameters;
        public int turnIssued;
    }

    // ==================== القائد الأعلى ====================

    /// <summary>
    /// SupremeCommander: واجهة اللاعب الرئيسية.
    /// يدير: المدن، القادة، الجيوش، الميزانية، والقرارات الاستراتيجية.
    /// 
    /// اللاعب يتخذ القرارات الكبرى فقط:
    /// - تعيين وعزل القادة
    /// - تحريك الجيوش بين المدن
    /// - ضبط الضرائب والميزانية
    /// - إعلان الحرب والسلم
    /// - اختيار الأبحاث
    /// 
    /// الإدارة التفصيلية يتعامل معها القادة AI تلقائياً.
    /// </summary>
    public class SupremeCommander
    {
        // ==================== بيانات اللعبة ====================

        [Serializable]
        public class GameState
        {
            public int currentTurn = 1;
            public float treasuryGold = 1000f;
            public float totalIncome = 0f;
            public float totalExpenses = 0f;
            public Dictionary<string, CityState> cities = new();
            public List<ArmyState> armies = new();
            public float globalTaxRate = 0.15f; // 15% ضريبة أساسية
        }

        [Serializable]
        public class CityState
        {
            public string cityName;
            public Vector3 position;
            public bool isCapital;
            public string governorName;
            public GovernorSystem.GovernorType governorType;
            public float cityLoyalty;
            public int garrisonSize;
            public bool hasGovernor => !string.IsNullOrEmpty(governorName);
        }

        [Serializable]
        public class ArmyState
        {
            public string armyName;
            public int soldierCount;
            public Vector3 position;
            public string originCity;
            public string targetCity;
            public bool isMoving;
            public float movementProgress;
        }

        // ==================== المتغيرات ====================

        private GameState _gameState;
        private readonly Dictionary<string, GovernorSystem.BaseGovernorAI> _activeGovernors;
        private readonly Dictionary<string, PopulationSystem.PopulationManager> _populationManagers;
        private readonly List<PlayerCommand> _commandHistory;
        private readonly List<string> _notifications;

        // ==================== أحداث اللاعب ====================

        /// <summary>
        /// يُطلق عند تعيين قائد جديد
        /// </summary>
        public event Action<string, string, GovernorSystem.GovernorType> OnGovernorAssigned;
        
        /// <summary>
        /// يُطلق عند عزل قائد
        /// </summary>
        public event Action<string, string> OnGovernorDismissed;
        
        /// <summary>
        /// يُطلق عند تلقي طلب موارد من قائد
        /// </summary>
        public event Action<string, Dictionary<string, float>> OnGovernorResourceRequest;
        
        /// <summary>
        /// يُطلق عند تلقي تقرير من قائد
        /// </summary>
        public event Action<string, string> OnGovernorReport;
        
        /// <summary>
        /// يُطلق عند تغير الميزانية
        /// </summary>
        public event Action<float, float> OnBudgetChanged; // (income, expenses)
        
        /// <summary>
        /// يُطلق عند وجود إشعار جديد
        /// </summary>
        public event Action<string> OnNotificationReceived;

        // ==================== الخصائص ====================

        public GameState State => _gameState;
        public int CurrentTurn => _gameState.currentTurn;
        public float Treasury => _gameState.treasuryGold;
        public float TaxRate => _gameState.globalTaxRate;
        public int CityCount => _gameState.cities.Count;
        public IReadOnlyList<string> Notifications => _notifications.AsReadOnly();

        // ==================== البناء ====================

        public SupremeCommander()
        {
            _gameState = new GameState();
            _activeGovernors = new Dictionary<string, GovernorSystem.BaseGovernorAI>();
            _populationManagers = new Dictionary<string, PopulationSystem.PopulationManager>();
            _commandHistory = new List<PlayerCommand>();
            _notifications = new List<string>();
        }

        // ==================== أوامر اللاعب ====================

        /// <summary>
        /// تعيين قائد لمدينة
        /// </summary>
        public void AssignGovernor(string cityName, GovernorSystem.GovernorType type)
        {
            if (!_gameState.cities.ContainsKey(cityName))
            {
                Debug.LogError($"City {cityName} not found!");
                return;
            }

            // إنشاء بيانات القائد
            var governorData = GovernorSystem.GovernorFactory.CreateGovernor(type, cityName);
            
            // إنشاء مدير سكان إذا لم يكن موجوداً
            if (!_populationManagers.ContainsKey(cityName))
            {
                _populationManagers[cityName] = new PopulationSystem.PopulationManager(
                    cityName, 
                    _gameState.cities[cityName].isCapital ? 500 : 200
                );
            }

            // إنشاء AI القائد
            var governorAI = GovernorSystem.GovernorFactory.CreateAIFromData(
                governorData, 
                _populationManagers[cityName]
            );

            // ربط أحداث القائد
            governorAI.OnGovernorReport += (city, report) =>
            {
                OnGovernorReport?.Invoke(city, report);
            };
            
            governorAI.OnResourceRequest += (city, resources) =>
            {
                OnGovernorResourceRequest?.Invoke(city, resources);
                AddNotification($"🏛️ [{cityName}] Governor requests resources");
            };

            // تسجيل القائد
            _activeGovernors[cityName] = governorAI;
            
            // تحديث بيانات المدينة
            _gameState.cities[cityName].governorName = governorData.governorName;
            _gameState.cities[cityName].governorType = type;

            // تسجيل الأمر
            var command = new PlayerCommand
            {
                type = PlayerCommandType.AssignGovernor,
                targetCity = cityName,
                turnIssued = _gameState.currentTurn
            };
            _commandHistory.Add(command);

            OnGovernorAssigned?.Invoke(cityName, governorData.governorName, type);
            AddNotification($"👑 Assigned {governorData.governorName} ({type}) to {cityName}");
            
            Debug.Log($"[SupremeCommander] Assigned {governorData.governorName} as {type} governor of {cityName}");
        }

        /// <summary>
        /// عزل قائد من مدينة
        /// </summary>
        public void DismissGovernor(string cityName)
        {
            if (!_activeGovernors.ContainsKey(cityName))
            {
                Debug.LogWarning($"No governor assigned to {cityName}");
                return;
            }

            string governorName = _activeGovernors[cityName].Data.governorName;

            // تأثير سلبي على الولاء
            if (_populationManagers.ContainsKey(cityName))
            {
                _populationManagers[cityName].ModifyLoyalty(-5f);
            }

            // إزالة القائد
            _activeGovernors.Remove(cityName);
            _gameState.cities[cityName].governorName = "";
            _gameState.cities[cityName].governorType = GovernorSystem.GovernorType.Economic;

            // تسجيل الأمر
            var command = new PlayerCommand
            {
                type = PlayerCommandType.DismissGovernor,
                targetCity = cityName,
                turnIssued = _gameState.currentTurn
            };
            _commandHistory.Add(command);

            OnGovernorDismissed?.Invoke(cityName, governorName);
            AddNotification($"⚠️ Dismissed {governorName} from {cityName}. Loyalty decreased.");
        }

        /// <summary>
        /// ضبط معدل الضرائب العام
        /// </summary>
        public void SetTaxRate(float rate)
        {
            rate = Mathf.Clamp(rate, 0f, 0.5f); // 0% إلى 50%
            float oldRate = _gameState.globalTaxRate;
            _gameState.globalTaxRate = rate;

            // تأثير الضرائب على ولاء جميع المدن
            float loyaltyImpact = (rate - oldRate) * -50f; // كل 1% زيادة = -0.5 ولاء
            
            foreach (var kvp in _populationManagers)
            {
                kvp.Value.ModifyLoyalty(loyaltyImpact);
                kvp.Value.ModifyHappiness(loyaltyImpact * -0.5f);
            }

            AddNotification($"💰 Tax rate changed: {oldRate * 100:F0}% → {rate * 100:F0}%");
            
            var command = new PlayerCommand
            {
                type = PlayerCommandType.SetTaxRate,
                turnIssued = _gameState.currentTurn
            };
            command.parameters = new Dictionary<string, object>
            {
                { "oldRate", oldRate },
                { "newRate", rate }
            };
            _commandHistory.Add(command);
        }

        /// <summary>
        /// إنشاء جيش والزحف به
        /// </summary>
        public void CreateAndMoveArmy(string originCity, string targetCity, int soldierCount)
        {
            if (!_populationManagers.ContainsKey(originCity))
            {
                Debug.LogError($"Origin city {originCity} not found!");
                return;
            }

            // تجنيد الجنود من المدينة
            var result = _populationManagers[originCity].RecruitSoldiers(soldierCount);
            if (!result.success)
            {
                AddNotification($"❌ Cannot recruit: {result.reason}");
                return;
            }

            // تأثير سلبي على الولاء (سحب الجيش)
            _populationManagers[originCity].ModifyLoyalty(-3f);

            // إنشاء الجيش
            var army = new ArmyState
            {
                armyName = $"Army from {originCity}",
                soldierCount = result.recruitedCount,
                position = _gameState.cities[originCity].position,
                originCity = originCity,
                targetCity = targetCity,
                isMoving = true,
                movementProgress = 0f
            };

            _gameState.armies.Add(army);

            // تسجيل الأمر
            var command = new PlayerCommand
            {
                type = PlayerCommandType.MoveArmy,
                targetCity = targetCity,
                turnIssued = _gameState.currentTurn
            };
            command.parameters = new Dictionary<string, object>
            {
                { "originCity", originCity },
                { "soldierCount", result.recruitedCount }
            };
            _commandHistory.Add(command);

            AddNotification($"⚔️ {result.recruitedCount} soldiers marching from {originCity} to {targetCity}");
        }

        // ==================== دورة اللعب ====================

        /// <summary>
        /// إنهاء الدورة الحالية والبدء بالدورة التالية
        /// </summary>
        public void EndTurn()
        {
            // 1. تحديث جميع القادة
            foreach (var kvp in _activeGovernors)
            {
                kvp.Value.OnTurnUpdate();
            }

            // 2. تحديث جميع مديري السكان (للمدن بدون قادة)
            foreach (var kvp in _populationManagers)
            {
                if (!_activeGovernors.ContainsKey(kvp.Key))
                {
                    kvp.Value.OnTurnUpdate();
                }
            }

            // 3. تحديث الجيوش المتحركة
            UpdateMovingArmies();

            // 4. تحديث الميزانية
            UpdateBudget();

            // 5. تنفيذ الأوامر المعلقة
            ProcessPendingCommands();

            // 6. التقدم للدورة التالية
            _gameState.currentTurn++;
            
            AddNotification($"📅 Turn {_gameState.currentTurn} begins");
        }

        /// <summary>
        /// تحديث الجيوش المتحركة
        /// </summary>
        private void UpdateMovingArmies()
        {
            foreach (var army in _gameState.armies)
            {
                if (!army.isMoving) continue;

                army.movementProgress += 0.2f; // 5 دورات للوصول

                if (army.movementProgress >= 1f)
                {
                    army.isMoving = false;
                    army.movementProgress = 1f;
                    
                    if (_gameState.cities.ContainsKey(army.targetCity))
                    {
                        army.position = _gameState.cities[army.targetCity].position;
                        AddNotification($"⚔️ Army arrived at {army.targetCity}");
                    }
                }
            }
        }

        /// <summary>
        /// تحديث الميزانية العامة
        /// </summary>
        private void UpdateBudget()
        {
            float totalIncome = 0f;
            float totalExpenses = 0f;

            // جمع الدخل من جميع المدن
            foreach (var kvp in _populationManagers)
            {
                var production = kvp.Value.CalculateProduction();
                totalIncome += production.gold;
                totalExpenses += production.foodConsumption * 0.1f; // تكلفة توزيع الغذاء
            }

            // تطبيق معدل الضرائب
            float taxIncome = totalIncome * _gameState.globalTaxRate;
            
            // تحديث الخزانة
            _gameState.treasuryGold += taxIncome - totalExpenses;
            _gameState.totalIncome = taxIncome;
            _gameState.totalExpenses = totalExpenses;

            OnBudgetChanged?.Invoke(_gameState.totalIncome, _gameState.totalExpenses);
        }

        /// <summary>
        /// معالجة الأوامر المعلقة
        /// </summary>
        private void ProcessPendingCommands()
        {
            // يمكن إضافة منطق للأوامر المؤجلة هنا
        }

        // ==================== الإشعارات ====================

        /// <summary>
        /// إضافة إشعار جديد
        /// </summary>
        private void AddNotification(string message)
        {
            _notifications.Add($"[Turn {_gameState.currentTurn}] {message}");
            
            // الحد الأقصى 50 إشعار
            if (_notifications.Count > 50)
            {
                _notifications.RemoveAt(0);
            }

            OnNotificationReceived?.Invoke(message);
        }

        /// <summary>
        /// الحصول على آخر إشعارات
        /// </summary>
        public List<string> GetRecentNotifications(int count = 10)
        {
            int start = Mathf.Max(0, _notifications.Count - count);
            return _notifications.GetRange(start, count - start);
        }

        /// <summary>
        /// مسح جميع الإشعارات
        /// </summary>
        public void ClearNotifications()
        {
            _notifications.Clear();
        }

        // ==================== دوال المعلومات ====================

        /// <summary>
        /// الحصول على ملخص عام للإمبراطورية
        /// </summary>
        public string GetEmpireSummary()
        {
            int totalPop = 0;
            int totalSoldiers = 0;
            float avgHappiness = 0f;
            float avgLoyalty = 0f;

            foreach (var kvp in _populationManagers)
            {
                var summary = kvp.Value.GetSummary();
                totalPop += summary.totalPopulation;
                totalSoldiers += summary.soldierCount;
                avgHappiness += summary.happiness;
                avgLoyalty += summary.loyalty;
            }

            int cityCount = _populationManagers.Count;
            if (cityCount > 0)
            {
                avgHappiness /= cityCount;
                avgLoyalty /= cityCount;
            }

            return $"🏠 Cities: {cityCount} | 👥 Population: {totalPop} | " +
                   $"⚔️ Soldiers: {totalSoldiers} | 😊 Happiness: {avgHappiness:F0}% | " +
                   $"🏰 Loyalty: {avgLoyalty:F0}% | 💰 Treasury: {_gameState.treasuryGold:F0}";
        }
    }
}
