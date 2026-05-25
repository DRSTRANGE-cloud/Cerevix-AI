const FormField = ({ label, error, id, children }) => (
    <div className="input-group">
        <label htmlFor={id}>{label}</label>
        {children}
        {error && (
            <p className="field-error" id={`${id}-error`} role="alert">
                {error}
            </p>
        )}
    </div>
)

export default FormField
