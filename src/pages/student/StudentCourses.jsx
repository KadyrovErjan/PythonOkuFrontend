import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import StudentSidebar from '../../components/StudentSidebar'
import Icon from '../../components/Icon'

export default function StudentCourses() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [notifCount, setNotifCount] = useState(0)
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState({})
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('users/me/'),
      api.get('courses/'),
      api.get('notifications/').catch(() => ({ data: [] })),
    ]).then(([userResponse, coursesResponse, notificationsResponse]) => {
      setUser(userResponse.data)
      setCourses(coursesResponse.data)
      setNotifCount((notificationsResponse.data || []).filter(item => !item.is_read).length)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const course = id ? courses.find(item => item.id === Number(id)) : null
    if (!course) return

    let active = true
    Promise.all([
      api.get(`courses/${course.id}/lessons/`),
      api.get('progress/').catch(() => ({ data: [] })),
    ]).then(([lessonsResponse, progressResponse]) => {
      if (!active) return
      setLessons(lessonsResponse.data)
      setProgress(Object.fromEntries(progressResponse.data.map(item => [item.lesson, item.completed])))
    }).catch(() => { if (active) setLessons([]) })

    return () => { active = false }
  }, [id, courses])

  const selectedCourse = id ? courses.find(item => item.id === Number(id)) ?? null : null
  const visibleCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return courses
    return courses.filter(course => `${course.title} ${course.description || ''}`.toLowerCase().includes(normalized))
  }, [courses, query])

  const completedLessons = lessons.filter(lesson => progress[lesson.id]).length
  const coursePercent = lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0

  if (loading) return (
    <div className="app-loader"><div className="loader-inner"><span className="loader-dot" /> Загружаем каталог</div></div>
  )

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <StudentSidebar user={user} notifCount={notifCount} />
      <main className="ml-56 flex-1 courses-main">
        {!selectedCourse ? (
          <>
            <header className="page-heading courses-heading">
              <div>
                <div className="page-kicker"><span /> Библиотека знаний</div>
                <h1>Выбери следующую тему</h1>
                <p>Курсы собраны в понятную траекторию — от основ до уверенной практики.</p>
              </div>
              <label className="course-search">
                <Icon name="search" size={18} />
                <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти курс" aria-label="Найти курс" />
                {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск">×</button>}
              </label>
            </header>

            <div className="catalog-meta">
              <span><strong>{visibleCourses.length}</strong> {visibleCourses.length === 1 ? 'курс' : 'курсов'}</span>
              <i />
              <span>Обновляемая программа</span>
            </div>

            {visibleCourses.length === 0 ? (
              <div className="content-panel empty-state catalog-empty">
                <div className="empty-icon"><Icon name="search" size={24} /></div>
                <h3>{courses.length ? 'Ничего не найдено' : 'Каталог скоро наполнится'}</h3>
                <p>{courses.length ? 'Попробуй изменить запрос или посмотреть весь каталог.' : 'Преподаватель ещё готовит первые материалы.'}</p>
                {courses.length > 0 && <button className="button button-secondary" onClick={() => setQuery('')}>Сбросить поиск</button>}
              </div>
            ) : (
              <section className="course-grid">
                {visibleCourses.map((course, index) => (
                  <button key={course.id} onClick={() => navigate(`/student/courses/${course.id}`)} className={`course-card course-tone-${index % 4}`}>
                    <span className="course-card-glow" />
                    <span className="course-card-top">
                      <span className="course-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="course-icon"><Icon name={index % 3 === 0 ? 'layers' : index % 3 === 1 ? 'bolt' : 'book'} size={21} /></span>
                    </span>
                    <span className="course-card-body">
                      <small>Учебный курс</small>
                      <strong>{course.title}</strong>
                      <span>{course.description || 'Короткие уроки, практика и проверка знаний.'}</span>
                    </span>
                    <span className="course-card-footer">
                      <span><Icon name="book" size={14} /> {course.lessons_count || 0} уроков</span>
                      <span className="course-open">Открыть <Icon name="arrow" size={16} /></span>
                    </span>
                  </button>
                ))}
              </section>
            )}
          </>
        ) : (
          <>
            <button className="back-button" onClick={() => navigate('/student/courses')}><span>←</span> Все курсы</button>

            <section className="course-detail-hero">
              <div className="course-detail-copy">
                <div className="hero-label"><Icon name="layers" size={15} /> Учебный курс</div>
                <h1>{selectedCourse.title}</h1>
                <p>{selectedCourse.description || 'Изучай материал последовательно и закрепляй знания на практике.'}</p>
                <div className="course-detail-meta">
                  <span><Icon name="book" size={16} /> {lessons.length} уроков</span>
                  <span><Icon name="check" size={16} /> {completedLessons} завершено</span>
                </div>
              </div>
              <div className="course-progress-card">
                <span>Прогресс курса</span>
                <strong>{coursePercent}%</strong>
                <div className="goal-track"><i style={{ width: `${coursePercent}%` }} /></div>
                <small>{completedLessons} из {lessons.length} уроков</small>
              </div>
            </section>

            <div className="section-title-row">
              <div><span className="panel-kicker">Программа</span><h2>Уроки курса</h2></div>
              <span>Проходи по порядку</span>
            </div>

            {lessons.length === 0 ? (
              <div className="content-panel empty-state catalog-empty"><div className="empty-icon"><Icon name="book" size={24} /></div><h3>Уроки ещё готовятся</h3><p>Преподаватель скоро добавит материал в этот курс.</p></div>
            ) : (
              <section className="lesson-timeline">
                {lessons.map((lesson, index) => {
                  const completed = progress[lesson.id]
                  return (
                    <button key={lesson.id} onClick={() => navigate(`/student/lessons/${lesson.id}`)} className={`timeline-lesson${completed ? ' completed' : ''}`}>
                      <span className="timeline-marker">{completed ? <Icon name="check" size={17} /> : String(index + 1).padStart(2, '0')}</span>
                      <span className="timeline-line" />
                      <span className="timeline-copy">
                        <small>Урок {index + 1}</small>
                        <strong>{lesson.title}</strong>
                        <span>{lesson.description || 'Открой урок, чтобы познакомиться с материалом.'}</span>
                      </span>
                      <span className="timeline-meta">
                        {lesson.duration_minutes > 0 && <small><Icon name="clock" size={14} /> {lesson.duration_minutes} мин</small>}
                        <i><Icon name={completed ? 'check' : 'play'} size={17} /></i>
                      </span>
                    </button>
                  )
                })}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
