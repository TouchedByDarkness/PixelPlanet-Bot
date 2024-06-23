// var NameToConstructor = map[string] func (string) Solver {
// 	"anticaptcha": NewAntiCaptcha}

// func New (name, token string) (Solver, error) {
// 	constructor, ok := NameToConstructor[name]
// 	if !ok {
// 		return nil, errors.New("cant find solver with name \"" + name + "\"")
// 	}

// 	return constructor(token), nil
// }

export const svgToBase64 = (svg: string/*, width: number, height: number*/) => {
	return 'data:image/svg+xml;base64,' + btoa(svg);
}