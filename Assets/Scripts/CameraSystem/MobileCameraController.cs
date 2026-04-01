// =============================================================================
// MobileCameraController.cs
// نظام التحكم بالكاميرا عبر اللمس - مخصص للأندرويد
// يُركَّز على GameObject يحتوي على Camera Component
// يدعم: السحب (Drag)، التقريب/التبعيد (Pinch-to-Zoom)، النقر (Tap)
// =============================================================================

using UnityEngine;
using System.Collections.Generic;

namespace GrandStrategyGame.CameraSystem
{
    /// <summary>
    /// MobileCameraController: يتحكم في حركة الكاميرا على خريطة العالم
    /// باستخدام إيماءات اللمس المتعددة (Multi-Touch Gestures).
    /// 
    /// الاستخدام:
    /// 1. أضف هذا السكربت إلى GameObject يحتوي على Camera.
    /// 2. اضبط CameraBounds في Inspector لتحديد حدود الخريطة.
    /// 3. اضبط LayerMask للأرضية (Ground) للنقر على الخريطة.
    /// </summary>
    [RequireComponent(typeof(Camera))]
    [AddComponentMenu("Grand Strategy/Camera/Mobile Camera Controller")]
    public class MobileCameraController : MonoBehaviour
    {
        // ==================== إعدادات الكاميرا ====================
        [Header("=== Camera Settings ===")]
        [Tooltip("الحد الأدنى للتكبير (أبعد مشاهدة)")]
        [SerializeField] private float _minZoom = 5f;
        
        [Tooltip("الحد الأقصى للتكبير (أقرب مشاهدة)")]
        [SerializeField] private float _maxZoom = 25f;
        
        [Tooltip("سرعة التقريب والتبعيد")]
        [SerializeField] private float _zoomSpeed = 0.5f;
        
        [Tooltip("سرعة السحب على الخريطة")]
        [SerializeField] private float _dragSpeed = 1.0f;
        
        [Tooltip("سلاسة الحركة (أقل = أكثر سلاسة)")]
        [SerializeField] private float _smoothSpeed = 5f;
        
        [Tooltip("حجم Orthographic للكاميرا (إذا كانت Orthographic)")]
        [SerializeField] private float _orthographicSize = 10f;

        // ==================== إعدادات حدود الخريطة ====================
        [Header("=== Map Boundaries ===")]
        [Tooltip("الحدود القصوى للخريطة - X Min")]
        [SerializeField] private float _boundsMinX = -50f;
        
        [Tooltip("الحدود القصوى للخريطة - X Max")]
        [SerializeField] private float _boundsMaxX = 50f;
        
        [Tooltip("الحدود القصوى للخريطة - Z Min")]
        [SerializeField] private float _boundsMinZ = -50f;
        
        [Tooltip("الحدود القصوى للخريطة - Z Max")]
        [SerializeField] private float _boundsMaxZ = 50f;

        // ==================== إعدادات النقر ====================
        [Header("=== Tap Selection ===")]
        [Tooltip("طبقة الأرضية للنقر على الخريطة")]
        [SerializeField] private LayerMask _groundLayerMask;
        
        [Tooltip("الحد الأقصى للمسافة بين بداية النقر ونهايته (بالبكسل) لاعتباره نقراً")]
        [SerializeField] private float _tapThreshold = 15f;
        
        [Tooltip("الحد الأقصى لمدة النقر (بالثواني)")]
        [SerializeField] private float _tapMaxDuration = 0.3f;

        // ==================== إعدادات الأداء ====================
        [Header("=== Performance ===")]
        [Tooltip("تمكين التحسين للأجهزة الضعيفة")]
        [SerializeField] private bool _performanceMode = false;

        // ==================== متغيرات خاصة ====================
        private Camera _camera;
        private Vector3 _targetPosition;
        private float _targetZoom;
        
        // متغيرات تتبع اللمس
        private Touch _firstTouch;
        private Touch _secondTouch;
        private float _initialPinchDistance;
        private float _currentPinchDistance;
        private Vector3 _initialTouchPosition;
        private Vector3 _dragStartWorldPosition;
        
        // حالة الإيماءات
        private bool _isDragging = false;
        private bool _isPinching = false;
        private bool _isTouching = false;
        
        // تتبع النقر
        private float _touchStartTime;
        private Vector2 _touchStartScreenPosition;
        
        // Smooth Damping
        private Vector3 _velocity = Vector3.zero;
        private float _zoomVelocity = 0f;

        // ==================== الأحداث (Events) ====================
        /// <summary>
        /// يُطلق عند النقر على نقطة في الخريطة
        /// الباراميتر: موقع النقر في العالم (World Position)
        /// </summary>
        public event System.Action<Vector3> OnMapTapped;
        
        /// <summary>
        /// يُطلق عند النقر على كائن قابل للتحديد
        /// الباراميتر: الكائن المُنقر
        /// </summary>
        public event System.Action<GameObject> OnSelectableTapped;
        
        /// <summary>
        /// يُطلق عند بدء السحب
        /// </summary>
        public event System.Action OnDragStarted;
        
        /// <summary>
        /// يُطلق عند انتهاء السحب
        /// </summary>
        public event System.Action OnDragEnded;

        // ==================== الخصائص (Properties) ====================
        public bool IsDragging => _isDragging;
        public bool IsPinching => _isPinching;
        public float CurrentZoom => _targetZoom;
        public Vector3 CurrentPosition => transform.position;

        // ==================== دورة حياة Unity ====================

        private void Awake()
        {
            _camera = GetComponent<Camera>();
            
            // تهيئة الموقع الهدف
            _targetPosition = transform.position;
            
            // تحديد نوع الكاميرا (Perspective أو Orthographic)
            if (_camera.orthographic)
            {
                _targetZoom = _camera.orthographicSize;
            }
            else
            {
                _targetZoom = _camera.fieldOfView;
            }
        }

        private void Start()
        {
            // في وضع الأداء، نُقلل من جودة الكاميرا
            if (_performanceMode)
            {
                _camera.allowHDR = false;
                _camera.allowMSAA = false;
            }
        }

        private void Update()
        {
            HandleTouchInput();
            SmoothCameraMovement();
        }

        // ==================== نظام معالجة اللمس ====================

        /// <summary>
        /// المعالجة الرئيسية لإيماءات اللمس
        /// يُنفَّذ كل إطار (Frame)
        /// </summary>
        private void HandleTouchInput()
        {
            // إذا لم يكن هناك أي لمسة، نُخرج
            if (Input.touchCount <= 0)
            {
                // إنهاء السحب عند رفع الإصبع
                if (_isDragging)
                {
                    _isDragging = false;
                    OnDragEnded?.Invoke();
                }
                _isTouching = false;
                return;
            }

            switch (Input.touchCount)
            {
                case 1:
                    HandleSingleTouch(Input.GetTouch(0));
                    break;

                case 2:
                    // عند وجود لمستين، ننتقل لوضع التقريب
                    _isDragging = false;
                    HandlePinchZoom(Input.GetTouch(0), Input.GetTouch(1));
                    break;
            }
        }

        /// <summary>
        /// معالجة لمسة واحدة: سحب أو نقر
        /// يُميّز بين السحب (Drag) والنقر (Tap) بناءً على المسافة والمدة
        /// </summary>
        private void HandleSingleTouch(Touch touch)
        {
            switch (touch.phase)
            {
                case TouchPhase.Began:
                    HandleTouchBegan(touch);
                    break;

                case TouchPhase.Moved:
                    HandleTouchMoved(touch);
                    break;

                case TouchPhase.Ended:
                case TouchPhase.Canceled:
                    HandleTouchEnded(touch);
                    break;
            }
        }

        /// <summary>
        /// عند بدء اللمسة: تسجيل الموقع والوقت
        /// </summary>
        private void HandleTouchBegan(Touch touch)
        {
            _isTouching = true;
            _isDragging = false;
            
            _firstTouch = touch;
            _initialTouchPosition = touch.position;
            _touchStartScreenPosition = touch.position;
            _touchStartTime = Time.time;

            // حساب موقع السحب في العالم
            Ray ray = _camera.ScreenPointToRay(touch.position);
            if (Physics.Raycast(ray, out RaycastHit hit, 100f, _groundLayerMask))
            {
                _dragStartWorldPosition = hit.point;
            }
        }

        /// <summary>
        /// عند تحريك الإصبع: التحقق مما إذا كان سحباً
        /// </summary>
        private void HandleTouchMoved(Touch touch)
        {
            if (!_isTouching) return;

            // حساب المسافة التي تحركها الإصبع
            float dragDistance = Vector2.Distance(touch.position, _initialTouchPosition);

            // إذا تجاوزت المسافة الحد الأدنى، اعتبرها سحباً
            if (dragDistance > _tapThreshold)
            {
                if (!_isDragging)
                {
                    _isDragging = true;
                    OnDragStarted?.Invoke();
                }

                PerformDrag(touch);
            }
        }

        /// <summary>
        /// تنفيذ السحب على الخريطة
        /// يحسب الإزاحة في العالم بناءً على حركة الإصبع على الشاشة
        /// </summary>
        private void PerformDrag(Touch touch)
        {
            // حساب موقع الإصبع الحالي في العالم
            Ray currentRay = _camera.ScreenPointToRay(touch.position);
            if (!Physics.Raycast(currentRay, out RaycastHit currentHit, 100f, _groundLayerMask))
                return;

            // حساب الفرق بين موقع البداية والحالي
            Vector3 worldDelta = _dragStartWorldPosition - currentHit.point;

            // تطبيق الإزاحة على الموقع المستهدف
            _targetPosition += worldDelta * _dragSpeed;

            // تحديث موقع البداية للسحب المستمر
            _dragStartWorldPosition = currentHit.point;
        }

        /// <summary>
        /// عند رفع الإصبع: التحقق مما إذا كان نقراً
        /// </summary>
        private void HandleTouchEnded(Touch touch)
        {
            if (!_isDragging && _isTouching)
            {
                // حساب مدة اللمسة
                float touchDuration = Time.time - _touchStartTime;
                
                // حساب المسافة
                float touchDistance = Vector2.Distance(touch.position, _touchStartScreenPosition);

                // إذا كانت اللمسة قصيرة وقريبة من مكان البداية = نقر
                if (touchDuration <= _tapMaxDuration && touchDistance <= _tapThreshold)
                {
                    ProcessTap(touch.position);
                }
            }

            if (_isDragging)
            {
                _isDragging = false;
                OnDragEnded?.Invoke();
            }

            _isTouching = false;
        }

        /// <summary>
        /// معالجة النقر: تحديد ما تم النقر عليه (أرضية أو كائن قابل للتحديد)
        /// </summary>
        private void ProcessTap(Vector2 screenPosition)
        {
            Ray ray = _camera.ScreenPointToRay(screenPosition);
            RaycastHit[] hits = Physics.RaycastAll(ray, 100f);

            // البحث عن كائنات قابلة للتحديد
            foreach (RaycastHit hit in hits)
            {
                GameObject hitObject = hit.collider.gameObject;
                
                // التحقق مما إذا كان الكائن قابلاً للتحديد
                ISelectable selectable = hitObject.GetComponent<ISelectable>();
                if (selectable != null)
                {
                    OnSelectableTapped?.Invoke(hitObject);
                    Debug.Log($"[Camera] Selected: {hitObject.name}");
                    return;
                }
            }

            // إذا لم يتم العثور على كائن قابل للتحديد، ننقر على الخريطة
            if (Physics.Raycast(ray, out RaycastHit groundHit, 100f, _groundLayerMask))
            {
                OnMapTapped?.Invoke(groundHit.point);
                Debug.Log($"[Camera] Map tapped at: {groundHit.point}");
            }
        }

        /// <summary>
        /// معالجة التقريب والتبعيد بإصبعين (Pinch-to-Zoom)
        /// يستخدم المسافة بين الإصبعين لتحديد مقدار التقريب
        /// </summary>
        private void HandlePinchZoom(Touch touch1, Touch touch2)
        {
            _firstTouch = touch1;
            _secondTouch = touch2;

            switch (touch1.phase)
            {
                case TouchPhase.Began:
                    // تسجيل المسافة الأولية بين الإصبعين
                    _initialPinchDistance = Vector2.Distance(touch1.position, touch2.position);
                    _isPinching = true;
                    break;

                case TouchPhase.Moved:
                    if (!_isPinching) return;

                    // حساب المسافة الحالية
                    _currentPinchDistance = Vector2.Distance(touch1.position, touch2.position);

                    // حساب نسبة التغيير
                    float pinchDelta = _initialPinchDistance - _currentPinchDistance;

                    // تطبيق التقريب أو التبعيد
                    AdjustZoom(pinchDelta);

                    // تحديث المسافة الأولية للاستجابة المستمرة
                    _initialPinchDistance = _currentPinchDistance;
                    break;

                case TouchPhase.Ended:
                case TouchPhase.Canceled:
                    _isPinching = false;
                    break;
            }
        }

        /// <summary>
        /// تعديل مستوى التقريب بناءً على حركة التقريب
        /// </summary>
        private void AdjustZoom(float pinchDelta)
        {
            // تحويل حركة الإصبع إلى قيمة تقريب
            float zoomChange = pinchDelta * _zoomSpeed * Time.deltaTime * 100f;

            _targetZoom += zoomChange;

            // التأكد من أن القيمة ضمن الحدود
            _targetZoom = Mathf.Clamp(_targetZoom, _minZoom, _maxZoom);
        }

        // ==================== نظام الحركة السلسة ====================

        /// <summary>
        /// تطبيق الحركة السلسة للكاميرا باستخدام Lerp / SmoothDamp
        /// يُنفَّذ كل إطار لضمان سلاسة الحركة
        /// </summary>
        private void SmoothCameraMovement()
        {
            // سلاسة الموقع
            if (_camera.orthographic)
            {
                // للكاميرا Orthographic: نحرك على المستوى XZ فقط
                Vector3 desiredPosition = new Vector3(
                    _targetPosition.x,
                    transform.position.y,
                    _targetPosition.z
                );
                
                // تطبيق حدود الخريطة
                desiredPosition = ClampPositionToBounds(desiredPosition);
                
                // سلاسة الحركة
                transform.position = Vector3.SmoothDamp(
                    transform.position,
                    desiredPosition,
                    ref _velocity,
                    1f / _smoothSpeed
                );

                // سلاسة التقريب
                _camera.orthographicSize = Mathf.SmoothDamp(
                    _camera.orthographicSize,
                    _targetZoom,
                    ref _zoomVelocity,
                    1f / _smoothSpeed
                );
            }
            else
            {
                // للكاميرا Perspective: نحرك على المستوى XZ
                Vector3 desiredPosition = new Vector3(
                    _targetPosition.x,
                    transform.position.y,
                    _targetPosition.z
                );
                
                desiredPosition = ClampPositionToBounds(desiredPosition);
                
                transform.position = Vector3.SmoothDamp(
                    transform.position,
                    desiredPosition,
                    ref _velocity,
                    1f / _smoothSpeed
                );

                // سلاسة FOV
                _camera.fieldOfView = Mathf.SmoothDamp(
                    _camera.fieldOfView,
                    _targetZoom,
                    ref _zoomVelocity,
                    1f / _smoothSpeed
                );
            }
        }

        /// <summary>
        /// تقييد موقع الكاميرا ضمن حدود الخريطة
        /// يأخذ بعين الاعتبار مستوى التقريب الحالي لتجنب رؤية خارج الخريطة
        /// </summary>
        private Vector3 ClampPositionToBounds(Vector3 position)
        {
            // حساب نسبة القابلية للرؤية بناءً على مستوى التقريب
            float viewScale = _camera.orthographic ? _targetZoom / _orthographicSize : _targetZoom / 60f;
            
            float boundsPadding = viewScale * 5f; // حشوة ديناميكية
            
            position.x = Mathf.Clamp(position.x, _boundsMinX + boundsPadding, _boundsMaxX - boundsPadding);
            position.z = Mathf.Clamp(position.z, _boundsMinZ + boundsPadding, _boundsMaxZ - boundsPadding);
            
            return position;
        }

        // ==================== دوال عامة ====================

        /// <summary>
        /// نقل الكاميرا إلى موقع محدد في العالم (مع سلاسة)
        /// </summary>
        /// <param name="worldPosition">الموقع المراد الانتقال إليه</param>
        /// <param name="zoomLevel">مستوى التقريب الاختياري</param>
        public void MoveToPosition(Vector3 worldPosition, float? zoomLevel = null)
        {
            _targetPosition = new Vector3(
                worldPosition.x,
                transform.position.y,
                worldPosition.z
            );

            if (zoomLevel.HasValue)
            {
                _targetZoom = Mathf.Clamp(zoomLevel.Value, _minZoom, _maxZoom);
            }
        }

        /// <summary>
        /// نقل الكاميرا للتركيز على مدينة معينة
        /// </summary>
        /// <param name="cityPosition">موقع المدينة</param>
        public void FocusOnCity(Vector3 cityPosition)
        {
            MoveToPosition(cityPosition, 12f);
        }

        /// <summary>
        /// نقل الكاميرا للتركيز على جيش معين
        /// </summary>
        /// <param name="armyPosition">موقع الجيش</param>
        public void FocusOnArmy(Vector3 armyPosition)
        {
            MoveToPosition(armyPosition, 8f);
        }

        /// <summary>
        /// عرض الخريطة بالكامل (أبعد مشاهدة)
        /// </summary>
        public void ShowFullMap()
        {
            Vector3 center = new Vector3(
                (_boundsMinX + _boundsMaxX) / 2f,
                transform.position.y,
                (_boundsMinZ + _boundsMaxZ) / 2f
            );
            MoveToPosition(center, _maxZoom);
        }

        /// <summary>
        /// تحديث حدود الخريطة (مفيد عند فتح مناطق جديدة)
        /// </summary>
        public void UpdateBounds(float minX, float maxX, float minZ, float maxZ)
        {
            _boundsMinX = minX;
            _boundsMaxX = maxX;
            _boundsMinZ = minZ;
            _boundsMaxZ = maxZ;
        }

        /// <summary>
        /// تفعيل/تعطيل التحكم بالكاميرا
        /// </summary>
        public void SetControlEnabled(bool enabled)
        {
            this.enabled = enabled;
        }

#if UNITY_EDITOR
        // ==================== أدوات التطوير ( Gizmos ) ====================
        
        private void OnDrawGizmosSelected()
        {
            // رسم حدود الخريطة
            Gizmos.color = Color.yellow;
            Vector3 bottomLeft = new Vector3(_boundsMinX, 0, _boundsMinZ);
            Vector3 bottomRight = new Vector3(_boundsMaxX, 0, _boundsMinZ);
            Vector3 topLeft = new Vector3(_boundsMinX, 0, _boundsMaxZ);
            Vector3 topRight = new Vector3(_boundsMaxX, 0, _boundsMaxZ);

            Gizmos.DrawLine(bottomLeft, bottomRight);
            Gizmos.DrawLine(bottomRight, topRight);
            Gizmos.DrawLine(topRight, topLeft);
            Gizmos.DrawLine(topLeft, bottomLeft);

            // رسم موقع الكاميرا الحالي
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireSphere(transform.position, 1f);
            
            // رسم الموقع المستهدف
            Gizmos.color = Color.green;
            Gizmos.DrawWireSphere(_targetPosition, 0.5f);
        }
#endif
    }

    // ==================== واجهة الكائنات القابلة للتحديد ====================
    
    /// <summary>
    /// واجهة يجب تطبيقها على أي كائن يمكن تحديده بالنقر
    /// مثل: المدن، الجيوش، الموارد
    /// </summary>
    public interface ISelectable
    {
        /// <summary>
        /// يتم استدعاؤها عند النقر على الكائن
        /// </summary>
        void OnSelected();
        
        /// <summary>
        /// يتم استدعاؤها عند إلغاء التحديد
        /// </summary>
        void OnDeselected();
        
        /// <summary>
        /// اسم العرض للكائن
        /// </summary>
        string DisplayName { get; }
        
        /// <summary>
        /// نوع الكائن (مدينة، جيش، مورد...)
        /// </summary>
        SelectableType Type { get; }
    }

    /// <summary>
    /// أنواع الكائنات القابلة للتحديد
    /// </summary>
    public enum SelectableType
    {
        City,
        Army,
        Resource,
        Territory,
        Building
    }
}
